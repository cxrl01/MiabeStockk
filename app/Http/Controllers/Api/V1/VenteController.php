<?php

namespace App\Http\Controllers\Api\V1;


use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVenteRequest;
use App\Models\Boutique;
use App\Models\Commande;
use App\Models\LigneCommande;
use App\Models\Produit;
use App\Traits\JournaliseActivite;
use Barryvdh\DomPDF\Facade\Pdf;
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
     * partir du prix courant du produit (figé sur la ligne) et du taux de TVA
     * de la boutique (figé sur la ligne également, voir note plus bas), sans
     * encore impacter le stock (l'impact se fait à la validation, cf.
     * Commande::valider()).
     */
    public function store(StoreVenteRequest $request): JsonResponse
    {
        $this->authorize('create', Commande::class);

        $user = Auth::user();

        try {
            // Résolution de la boutique concernée par la vente, selon le rôle :
            // - Gérant : passe par boutiquesGerees() (pas de boutique_id sur users, un
            //   Gérant peut posséder plusieurs boutiques). S'il n'en a qu'une, on la prend
            //   par défaut ; sinon le frontend doit préciser boutique_id (sélecteur de
            //   boutique active).
            // - Gestionnaire/Commercial : boutique_id fixe sur users.
            // - Super Admin : n'a pas de boutique propre, doit préciser boutique_id.
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

            $commande = DB::transaction(function () use ($request, $user, $boutique) {
                $commande = Commande::create([
                    'boutique_id' => $boutique->id,
                    'type' => 'vente',
                    'client_id' => $request->input('client_id'),
                    'user_id' => $user->id,
                ]);

                foreach ($request->input('lignes') as $donneesLigne) {
                    $produit = Produit::where('boutique_id', $boutique->id)
                        ->findOrFail($donneesLigne['produit_id']);

                    if ($produit->quantite_stock < $donneesLigne['quantite']) {
                        throw new RuntimeException("Stock insuffisant pour {$produit->nom}.");
                    }

                    LigneCommande::create([
                        'commande_id' => $commande->id,
                        'produit_id' => $produit->id,
                        'quantite' => $donneesLigne['quantite'],
                        'prix_unitaire' => $produit->prix_vente,
                        // Le taux de TVA vient de la boutique (diagramme de classe du
                        // mémoire : TVA est un attribut de Boutique, pas de Produit), et
                        // est copié ici (comme prix_unitaire) pour figer l'historique :
                        // si la boutique change son taux plus tard, les ventes passées
                        // ne doivent pas être recalculées.
                        'taux_tva' => $boutique->tva,
                    ]);
                }

                $commande->recalculerMontants();
                $commande->valider(); // impacte le stock (sortie) et passe statut=validee

                // Paiement initial encaissé au moment de la vente (mémoire, cas
                // d'utilisation "Effectuer une vente" : choix du mode de paiement et
                // validation en une seule étape). Le modele Paiement se charge lui-même,
                // via ses hooks, de mettre à jour commande.montant_paye,
                // commande.statut_paiement et decrementer la dette du client — on ne
                // les touche pas ici.
                $montantPaye = (float) $request->input('montant_paye', 0);
                if ($montantPaye > 0) {
                    $commande->paiements()->create([
                        'montant' => $montantPaye,
                        'mode' => $request->input('mode_paiement', 'especes'),
                        'user_id' => $user->id,
                    ]);
                }

                // "Suivre dette" (Tableau 6) : si la vente laisse un solde impaye
                // apres le paiement initial eventuel, on l'ajoute a la dette du
                // client. Chaque paiement ulterieur la decremente deja via
                // Paiement::booted().
                $commande->refresh();
                if ($commande->client && $commande->solde() > 0) {
                    $commande->client->increment('dette', $commande->solde());
                }

                return $commande;
            });
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->journaliser('vente.creee', $commande, ['montant_ttc' => $commande->montant_ttc]);

        return response()->json($commande->load(['lignes.produit', 'client', 'paiements']), 201);
    }

    public function show(Commande $vente): JsonResponse
    {
        $this->authorize('view', $vente);

        return response()->json($vente->load(['lignes.produit', 'client', 'paiements']));
    }

    /**
     * Génère la facture PDF d'une vente (Tableau 6 du mémoire, "Générer PDF" :
     * Gérant et Commercial uniquement). Le lien frontend navigue vers cette route
     * via un fetch axios authentifié (pas une navigation <a href> directe, pour
     * garantir que l'authentification par cookie de session Sanctum s'applique).
     *
     * Anciennement dupliquée avec une méthode facturePdf() distincte (vue
     * pdf.facture-vente, autorisation 'view' au lieu de 'genererPdf') : supprimée
     * ici, elle contournait la restriction de rôle de ce tableau puisque 'view'
     * est ouvert plus largement que 'genererPdf'. Une seule route doit exister
     * pour la facture, pas deux avec des niveaux de securite différents.
     */
    public function facture(Commande $vente)
    {
        $this->authorize('genererPdf', $vente);

        $vente->load(['lignes.produit', 'client', 'boutique', 'paiements']);

        $pdf = Pdf::loadView('factures.vente', ['vente' => $vente]);

        return $pdf->stream("facture-{$vente->numero}.pdf");
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