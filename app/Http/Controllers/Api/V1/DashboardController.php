<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Depense;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $boutiqueIds = match (true) {
            $user->hasRole('super_admin') => null,
            $user->hasRole('gerant') => $user->boutiquesGerees()->pluck('id'),
            default => collect([$user->boutique_id]),
        };

        $ventesValideesQuery = fn () => Commande::query()
            ->where('type', 'vente')
            ->where('statut', 'validee')
            ->when($boutiqueIds, fn ($q) => $q->whereIn('boutique_id', $boutiqueIds));

        $produitsQuery = fn () => Produit::query()
            ->when($boutiqueIds, fn ($q) => $q->whereIn('boutique_id', $boutiqueIds));

        return response()->json([
            'ventes_jour' => $ventesValideesQuery()->whereDate('created_at', today())->count(),
            'ca_jour' => (float) $ventesValideesQuery()->whereDate('created_at', today())->sum('montant_ttc'),
            'ca_mois' => (float) $ventesValideesQuery()->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->sum('montant_ttc'),
            'total_clients' => Client::query()
                ->when($boutiqueIds, fn ($q) => $q->whereIn('boutique_id', $boutiqueIds))
                ->count(),
            'depenses_mois' => (float) Depense::query()
                ->when($boutiqueIds, fn ($q) => $q->whereIn('boutique_id', $boutiqueIds))
                ->whereMonth('date_depense', now()->month)
                ->whereYear('date_depense', now()->year)
                ->sum('montant'),
            'produits_en_alerte' => $produitsQuery()
                ->whereColumn('quantite_stock', '<=', 'seuil_alerte')
                ->count(),
            'ventes_impayees' => $ventesValideesQuery()
                ->whereIn('statut_paiement', ['non_payee', 'partielle'])
                ->count(),
            'dernieres_ventes' => Commande::query()
                ->where('type', 'vente')
                ->when($boutiqueIds, fn ($q) => $q->whereIn('boutique_id', $boutiqueIds))
                ->with('client:id,nom')
                ->latest()
                ->limit(5)
                ->get(['id', 'numero', 'client_id', 'montant_ttc', 'montant_paye', 'statut', 'statut_paiement', 'created_at']),
            'alertes_stock' => $produitsQuery()
                ->whereColumn('quantite_stock', '<=', 'seuil_alerte')
                ->orderBy('quantite_stock')
                ->limit(5)
                ->get(['id', 'nom', 'quantite_stock', 'seuil_alerte']),
        ]);
    }
}