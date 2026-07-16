<?php

namespace App\Http\Controllers\Api\V1;


use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVenteRequest;
use App\Models\Commande;
use App\Models\LigneCommande;
use App\Models\Produit;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VenteController extends Controller
{
    use JournaliseActivite;

    /**
     * Liste paginée des ventes, toujours filtrée par boutique : un membre du
     * staff ne voit que sa boutique, un Gérant voit ses boutiques, un Super
     * Admin peut préciser ?boutique_id= pour superviser une boutique donnée.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Commande::class);

        $user = Auth::user();

        $query = Commande::query()->where('type', 'vente')->with(['client', 'lignes.produit']);

        if ($user->hasRole('super_admin')) {
            if ($request->filled('boutique_id')) {
                $query->where('boutique_id', $request->integer('boutique_id'));
            }
        } elseif ($user->hasRole('gerant')) {
            $query->whereIn('boutique_id', $user->boutiquesGerees()->pluck('id'));
        } else {
            $query->where('boutique_id', $user->boutique_id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut'));
        }

        return response()->json($query->latest()->paginate(20));
    }

    /**
     * Crée une vente en attente : calcule les montants ligne par ligne à
     * partir du prix courant du produit (figé sur la ligne), sans encore
     * impacter le stock (l'impact se fait à la validation, cf. Commande::valider()).
     */
    public function store(StoreVenteRequest $request): JsonResponse
    {
        $this->authorize('create', Commande::class);

        $user = Auth::user();

        if (! $user->boutique_id && ! $user->hasRole('super_admin')) {
            return response()->json(['message' => 'Utilisateur non rattaché à une boutique.'], 422);
        }

        $boutiqueId = $user->boutique_id ?? $request->integer('boutique_id');

        try {
            $commande = DB::transaction(function () use ($request, $user, $boutiqueId) {
                $commande = Commande::create([
                    'boutique_id' => $boutiqueId,
                    'type' => 'vente',
                    'client_id' => $request->input('client_id'),
                    'user_id' => $user->id,
                ]);

                foreach ($request->input('lignes') as $donneesLigne) {
                    $produit = Produit::where('boutique_id', $boutiqueId)
                        ->findOrFail($donneesLigne['produit_id']);

                    if ($produit->quantite_stock < $donneesLigne['quantite']) {
                        throw new RuntimeException("Stock insuffisant pour {$produit->nom}.");
                    }

                    LigneCommande::create([
                        'commande_id' => $commande->id,
                        'produit_id' => $produit->id,
                        'quantite' => $donneesLigne['quantite'],
                        'prix_unitaire' => $produit->prix_vente,
                        'taux_tva' => $produit->taux_tva,
                    ]);
                }

                $commande->recalculerMontants();
                $commande->valider(); // impacte le stock (sortie) et passe statut=validee

                return $commande;
            });
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->journaliser('vente.creee', $commande, ['montant_ttc' => $commande->montant_ttc]);

        return response()->json($commande->load(['lignes.produit', 'client']), 201);
    }

    public function show(Commande $vente): JsonResponse
    {
        return response()->json($vente->load(['lignes.produit', 'client', 'paiements']));
    }

    /**
     * Annule une vente validée : réintègre le stock ligne par ligne via
     * Commande::annuler(), qui appelle Produit::augmenterStock() pour chaque
     * ligne (traçabilité complète dans mouvements_stock).
     */
    public function annuler(Commande $vente): JsonResponse
    {
        $this->authorize('annuler', $vente);

        try {
            $vente->annuler();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->journaliser('vente.annulee', $vente);

        return response()->json($vente->fresh(['lignes.produit']));
    }
}