<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLivraisonRequest;
use App\Models\Boutique;
use App\Models\Commande;
use App\Models\Fournisseur;
use App\Models\LigneCommande;
use App\Models\Produit;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LivraisonController extends Controller
{
    use JournaliseActivite;

    /**
     * Liste paginee des livraisons, meme logique de filtrage par boutique que
     * VenteController::index() (staff -> sa boutique, gerant -> ses boutiques,
     * super admin -> ?boutique_id= optionnel).
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Commande::class);

        $user = Auth::user();
        $query = Commande::query()->where('type', 'livraison')->with(['fournisseur', 'lignes.produit']);

        if ($user->hasRole('super_admin')) {
            if ($request->filled('boutique_id')) {
                $query->where('boutique_id', $request->integer('boutique_id'));
            }
        } elseif ($user->hasRole('gerant')) {
            $query->whereIn('boutique_id', $user->boutiquesGerees()->pluck('id'));
        } else {
            $query->where('boutique_id', $user->boutique_id);
        }

        return response()->json($query->latest()->paginate(20));
    }

    /**
     * Enregistre une livraison recue d'un fournisseur : augmente le stock des
     * produits concernes (via Commande::valider(), meme mecanisme que pour une
     * vente mais en sens inverse), et incremente la dette fournisseur si la
     * livraison n'est pas payee integralement a la reception.
     *
     * Contrairement a une vente, le prix unitaire vient de la requete (prix
     * d'achat negocie a cette livraison precise), pas du prix stocke sur le
     * produit — un meme produit peut etre achete a des prix differents d'une
     * livraison a l'autre.
     */
    public function store(StoreLivraisonRequest $request): JsonResponse
    {
        $this->authorize('create', \App\Models\Fournisseur::class);

        $user = Auth::user();

        try {
            $boutique = match (true) {
                $user->hasRole('gerant') => $request->filled('boutique_id')
                    ? $user->boutiquesGerees()->findOrFail($request->integer('boutique_id'))
                    : $user->boutiquesGerees()->firstOr(function () {
                        throw new RuntimeException('Aucune boutique associée à ce compte gérant.');
                    }),
                $user->hasRole('super_admin') => Boutique::findOrFail($request->integer('boutique_id')),
                default => $user->boutique_id
                    ? Boutique::findOrFail($user->boutique_id)
                    : throw new RuntimeException('Utilisateur non rattaché à une boutique.'),
            };

            $fournisseur = Fournisseur::where('boutique_id', $boutique->id)
                ->findOrFail($request->integer('fournisseur_id'));

            $commande = DB::transaction(function () use ($request, $user, $boutique, $fournisseur) {
                $commande = Commande::create([
                    'boutique_id' => $boutique->id,
                    'type' => 'livraison',
                    'fournisseur_id' => $fournisseur->id,
                    'user_id' => $user->id,
                ]);

                foreach ($request->input('lignes') as $donneesLigne) {
                    $produit = Produit::where('boutique_id', $boutique->id)
                        ->findOrFail($donneesLigne['produit_id']);

                    LigneCommande::create([
                        'commande_id' => $commande->id,
                        'produit_id' => $produit->id,
                        'quantite' => $donneesLigne['quantite'],
                        'prix_unitaire' => $donneesLigne['prix_unitaire'],
                        // Pas de TVA sur une livraison (achat aupres d'un fournisseur,
                        // hors du perimetre TVA-sur-vente decrit dans le memoire).
                        'taux_tva' => 0,
                    ]);
                }

                $commande->recalculerMontants();
                $commande->valider(); // augmente le stock (entree) pour chaque ligne

                // "Gerer dette fournisseur" (Tableau 6) : la dette du fournisseur
                // augmente du montant TOTAL de la livraison des sa validation, AVANT
                // le paiement initial eventuel (qui la decremente via Paiement::booted()).
                // Meme ordre que VenteController::store(), pour la meme raison : sinon
                // une livraison payee integralement a la reception ferait passer la
                // dette en negatif.
                $fournisseur->increment('dette', $commande->montant_ttc);

                $montantPaye = (float) $request->input('montant_paye', 0);
                if ($montantPaye > 0) {
                    $commande->paiements()->create([
                        'montant' => $montantPaye,
                        'mode' => $request->input('mode_paiement', 'especes'),
                        'user_id' => $user->id,
                    ]);
                }

                return $commande;
            });
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->journaliser('livraison.creee', $commande, ['montant_ttc' => $commande->montant_ttc]);

        return response()->json($commande->load(['lignes.produit', 'fournisseur', 'paiements']), 201);
    }

    public function show(Commande $livraison): JsonResponse
    {
        $this->authorize('view', $livraison);

        return response()->json($livraison->load(['lignes.produit', 'fournisseur', 'paiements']));
    }
}