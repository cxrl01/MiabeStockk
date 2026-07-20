<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\Commande;
use App\Models\Depense;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class RapportController extends Controller
{
    /**
     * Tableau 6 du memoire : "Generer rapports et statistiques" et "Exporter
     * rapport PDF" n'apparaissent QUE dans la liste du Gerant. Pas de Policy
     * dediee (Rapport n'est pas un modele Eloquent) : verification directe du
     * role, comme le fait deja EquipePolicy pour la meme raison de portee.
     */
    private function autoriserGerantSeul(): void
    {
        if (! Auth::user()->hasRole('gerant')) {
            throw new AccessDeniedHttpException('Réservé au Gérant.');
        }
    }

    private function boutiqueIds()
    {
        return Auth::user()->boutiquesGerees()->pluck('id');
    }

    /**
     * Donnees agregees pour l'ecran Rapports & Stats : CA du mois, ventes
     * totales, nouveaux clients, produits vendus, CA mensuel (annee en cours),
     * nombre de ventes mensuel, top 5 produits.
     */
    public function statistiques(Request $request): JsonResponse
    {
        $this->autoriserGerantSeul();

        $boutiqueIds = $this->boutiqueIds();
        $debutAnnee = now()->startOfYear();

        $ventesAnnee = Commande::query()
            ->where('type', 'vente')
            ->where('statut', 'validee')
            ->whereIn('boutique_id', $boutiqueIds)
            ->where('created_at', '>=', $debutAnnee)
            ->get(['id', 'montant_ttc', 'created_at']);

        $ventesMois = $ventesAnnee->filter(fn ($v) => $v->created_at->isSameMonth(now()));

        // CA + nombre de ventes par mois (Janvier -> mois en cours), pour les
        // graphiques (meme logique que la maquette "Jan - Jul 2026").
        $caMensuel = [];
        $ventesMensuel = [];
        for ($mois = 1; $mois <= now()->month; $mois++) {
            $ventesDuMois = $ventesAnnee->filter(fn ($v) => (int) $v->created_at->format('n') === $mois);
            $caMensuel[] = ['mois' => $mois, 'total' => (float) $ventesDuMois->sum('montant_ttc')];
            $ventesMensuel[] = ['mois' => $mois, 'nombre' => $ventesDuMois->count()];
        }

        $topProduits = DB::table('ligne_commandes')
            ->join('commandes', 'commandes.id', '=', 'ligne_commandes.commande_id')
            ->join('produits', 'produits.id', '=', 'ligne_commandes.produit_id')
            ->where('commandes.type', 'vente')
            ->where('commandes.statut', 'validee')
            ->whereIn('commandes.boutique_id', $boutiqueIds)
            ->where('commandes.created_at', '>=', $debutAnnee)
            ->groupBy('produits.id', 'produits.nom')
            ->orderByDesc(DB::raw('SUM(ligne_commandes.quantite)'))
            ->limit(5)
            ->select('produits.nom', DB::raw('SUM(ligne_commandes.quantite) as quantite_vendue'), DB::raw('SUM(ligne_commandes.montant_ttc) as montant_total'))
            ->get();

        return response()->json([
            'ca_mois' => (float) $ventesMois->sum('montant_ttc'),
            'ventes_totales_annee' => $ventesAnnee->count(),
            'nouveaux_clients_mois' => \App\Models\Client::query()
                ->whereIn('boutique_id', $boutiqueIds)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'produits_vendus_mois' => (int) DB::table('ligne_commandes')
                ->join('commandes', 'commandes.id', '=', 'ligne_commandes.commande_id')
                ->where('commandes.type', 'vente')
                ->where('commandes.statut', 'validee')
                ->whereIn('commandes.boutique_id', $boutiqueIds)
                ->whereMonth('commandes.created_at', now()->month)
                ->whereYear('commandes.created_at', now()->year)
                ->sum('ligne_commandes.quantite'),
            'ca_mensuel' => $caMensuel,
            'ventes_mensuel' => $ventesMensuel,
            'top_produits' => $topProduits,
        ]);
    }

    /**
     * "Resultat net" (glossaire du memoire) = CA - cout des livraisons - depenses,
     * sur une periode donnee (mois en cours par defaut).
     */
    public function resultatNet(Request $request): JsonResponse
    {
        $this->autoriserGerantSeul();

        $boutiqueIds = $this->boutiqueIds();
        $debut = $request->filled('debut') ? $request->date('debut') : now()->startOfMonth();
        $fin = $request->filled('fin') ? $request->date('fin') : now()->endOfMonth();

        $ca = (float) Commande::query()
            ->where('type', 'vente')->where('statut', 'validee')
            ->whereIn('boutique_id', $boutiqueIds)
            ->whereBetween('created_at', [$debut, $fin])
            ->sum('montant_ttc');

        $coutLivraisons = (float) Commande::query()
            ->where('type', 'livraison')->where('statut', 'validee')
            ->whereIn('boutique_id', $boutiqueIds)
            ->whereBetween('created_at', [$debut, $fin])
            ->sum('montant_ttc');

        $depenses = (float) Depense::query()
            ->whereIn('boutique_id', $boutiqueIds)
            ->whereBetween('date_depense', [$debut, $fin])
            ->sum('montant');

        return response()->json([
            'periode' => ['debut' => $debut->toDateString(), 'fin' => $fin->toDateString()],
            'chiffre_affaires' => $ca,
            'cout_livraisons' => $coutLivraisons,
            'depenses' => $depenses,
            'resultat_net' => $ca - $coutLivraisons - $depenses,
        ]);
    }

    /**
     * Export PDF du rapport (Tableau 6 : "Exporter rapport PDF", Gerant seul).
     */
    public function exportPdf(Request $request)
    {
        $this->autoriserGerantSeul();

        $user = Auth::user();
        $boutique = Boutique::whereIn('id', $this->boutiqueIds())->first();

        $statistiques = json_decode($this->statistiques($request)->getContent(), true);
        $resultat = json_decode($this->resultatNet($request)->getContent(), true);

        $pdf = Pdf::loadView('rapports.mensuel', [
            'boutique' => $boutique,
            'statistiques' => $statistiques,
            'resultat' => $resultat,
        ]);

        return $pdf->stream('rapport-' . now()->format('Y-m') . '.pdf');
    }
}