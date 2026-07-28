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
     * Resout la periode a analyser a partir des parametres de filtre :
     * - type=mois    -> mois + annee (defaut : mois/annee en cours)
     * - type=annee   -> annee entiere
     * - type=periode -> debut + fin (dates libres, peut chevaucher plusieurs annees)
     * Retourne [Carbon $debut, Carbon $fin, string $type].
     */
    private function resoudrePeriode(Request $request): array
    {
        $type = $request->input('type', 'mois');

        if ($type === 'annee') {
            $annee = (int) $request->input('annee', now()->year);
            $debut = now()->setDate($annee, 1, 1)->startOfDay();
            $fin = now()->setDate($annee, 12, 31)->endOfDay();
        } elseif ($type === 'periode') {
            $debut = $request->filled('debut') ? $request->date('debut')->startOfDay() : now()->startOfMonth();
            $fin = $request->filled('fin') ? $request->date('fin')->endOfDay() : now()->endOfMonth();
        } else {
            $type = 'mois';
            $annee = (int) $request->input('annee', now()->year);
            $mois = (int) $request->input('mois', now()->month);
            $debut = now()->setDate($annee, $mois, 1)->startOfMonth();
            $fin = (clone $debut)->endOfMonth();
        }

        return [$debut, $fin, $type];
    }

    /**
     * Donnees agregees pour l'ecran Rapports & Stats, sur la periode filtree :
     * CA, ventes, nouveaux clients, produits vendus, evolution mensuelle
     * (CA + nombre de ventes, un point par mois calendaire meme si la
     * periode chevauche plusieurs annees), top 5 produits.
     */
    public function statistiques(Request $request): JsonResponse
    {
        $this->autoriserGerantSeul();

        $boutiqueIds = $this->boutiqueIds();
        [$debut, $fin, $type] = $this->resoudrePeriode($request);

        $ventesPeriode = Commande::query()
            ->where('type', 'vente')
            ->where('statut', 'validee')
            ->whereIn('boutique_id', $boutiqueIds)
            ->whereBetween('created_at', [$debut, $fin])
            ->get(['id', 'montant_ttc', 'created_at']);

        // Graphiques mensuels : un point par mois calendaire, de $debut a $fin,
        // meme si la periode chevauche plusieurs annees (ex. juin 2025 -> mars 2026).
        $ventesGraphique = Commande::query()
            ->where('type', 'vente')
            ->where('statut', 'validee')
            ->whereIn('boutique_id', $boutiqueIds)
            ->whereBetween('created_at', [$debut->copy()->startOfMonth(), $fin->copy()->endOfMonth()])
            ->get(['id', 'montant_ttc', 'created_at']);

        $caMensuel = [];
        $ventesMensuel = [];
        $curseur = $debut->copy()->startOfMonth();
        $limite = $fin->copy()->startOfMonth();
        while ($curseur->lte($limite)) {
            $anneeCourante = $curseur->year;
            $moisCourant = $curseur->month;

            $ventesDuMois = $ventesGraphique->filter(
                fn ($v) => $v->created_at->year === $anneeCourante && $v->created_at->month === $moisCourant
            );

            $caMensuel[] = ['mois' => $moisCourant, 'annee' => $anneeCourante, 'total' => (float) $ventesDuMois->sum('montant_ttc')];
            $ventesMensuel[] = ['mois' => $moisCourant, 'annee' => $anneeCourante, 'nombre' => $ventesDuMois->count()];

            $curseur->addMonth();
        }

        $topProduits = DB::table('ligne_commandes')
            ->join('commandes', 'commandes.id', '=', 'ligne_commandes.commande_id')
            ->join('produits', 'produits.id', '=', 'ligne_commandes.produit_id')
            ->where('commandes.type', 'vente')
            ->where('commandes.statut', 'validee')
            ->whereIn('commandes.boutique_id', $boutiqueIds)
            ->whereBetween('commandes.created_at', [$debut, $fin])
            ->groupBy('produits.id', 'produits.nom')
            ->orderByDesc(DB::raw('SUM(ligne_commandes.quantite)'))
            ->limit(5)
            ->select('produits.nom', DB::raw('SUM(ligne_commandes.quantite) as quantite_vendue'), DB::raw('SUM(ligne_commandes.montant_ttc) as montant_total'))
            ->get();

        return response()->json([
            'periode' => ['type' => $type, 'debut' => $debut->toDateString(), 'fin' => $fin->toDateString()],
            'ca_periode' => (float) $ventesPeriode->sum('montant_ttc'),
            'ventes_periode' => $ventesPeriode->count(),
            'nouveaux_clients_periode' => \App\Models\Client::query()
                ->whereIn('boutique_id', $boutiqueIds)
                ->whereBetween('created_at', [$debut, $fin])
                ->count(),
            'produits_vendus_periode' => (int) DB::table('ligne_commandes')
                ->join('commandes', 'commandes.id', '=', 'ligne_commandes.commande_id')
                ->where('commandes.type', 'vente')
                ->where('commandes.statut', 'validee')
                ->whereIn('commandes.boutique_id', $boutiqueIds)
                ->whereBetween('commandes.created_at', [$debut, $fin])
                ->sum('ligne_commandes.quantite'),
            'ca_mensuel' => $caMensuel,
            'ventes_mensuel' => $ventesMensuel,
            'top_produits' => $topProduits,
        ]);
    }

    /**
     * "Resultat net" (glossaire du memoire) = CA - cout des livraisons - depenses,
     * sur la periode filtree.
     */
    public function resultatNet(Request $request): JsonResponse
    {
        $this->autoriserGerantSeul();

        $boutiqueIds = $this->boutiqueIds();
        [$debut, $fin] = $this->resoudrePeriode($request);

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
     * Respecte le meme filtre de periode que l'ecran (type/mois/annee/debut/fin).
     */
    public function exportPdf(Request $request)
    {
        $this->autoriserGerantSeul();

        $boutique = Boutique::whereIn('id', $this->boutiqueIds())->first();

        $statistiques = json_decode($this->statistiques($request)->getContent(), true);
        $resultat = json_decode($this->resultatNet($request)->getContent(), true);

        $pdf = Pdf::loadView('rapports.mensuel', [
            'boutique' => $boutique,
            'statistiques' => $statistiques,
            'resultat' => $resultat,
        ]);

        return $pdf->stream('rapport-' . now()->format('Y-m-d') . '.pdf');
    }
}