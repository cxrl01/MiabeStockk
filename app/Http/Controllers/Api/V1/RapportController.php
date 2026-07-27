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
     * Résout la période à analyser à partir des paramètres de filtre :
     * - type=mois    -> mois + annee (defaut : mois/annee en cours)
     * - type=annee   -> annee entiere
     * - type=periode -> debut + fin (dates libres)
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

        // Graphiques mensuels : toujours affichés sur l'année du début de la
        // période sélectionnée (Janvier -> mois en cours si année courante,
        // sinon Janvier -> Décembre ou mois de fin selon le cas).
        $anneeGraphique = $debut->year;
        if ($anneeGraphique === now()->year) {
            $dernierMois = now()->month;
        } else {
            $dernierMois = $fin->year === $anneeGraphique ? $fin->month : 12;
        }

        $ventesAnneeGraphique = Commande::query()
            ->where('type', 'vente')
            ->where('statut', 'validee')
            ->whereIn('boutique_id', $boutiqueIds)
            ->whereYear('created_at', $anneeGraphique)
            ->get(['id', 'montant_ttc', 'created_at']);

        $caMensuel = [];
        $ventesMensuel = [];
        for ($mois = 1; $mois <= $dernierMois; $mois++) {
            $ventesDuMois = $ventesAnneeGraphique->filter(fn ($v) => (int) $v->created_at->format('n') === $mois);
            $caMensuel[] = ['mois' => $mois, 'total' => (float) $ventesDuMois->sum('montant_ttc')];
            $ventesMensuel[] = ['mois' => $mois, 'nombre' => $ventesDuMois->count()];
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

        return $pdf->stream('rapport-' . now()->format('Y-m') . '.pdf');
    }
}