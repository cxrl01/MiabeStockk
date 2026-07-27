<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Boutique;
use App\Models\Commande;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class SuperAdminController extends Controller
{
    /**
     * Tableau 6 : "Consulter statistiques globales" et "Consulter journal d'activité"
     * n'appartiennent qu'au Super Admin. Pas de Policy dédiée (ni Statistique ni Journal
     * ne sont des modèles Eloquent à proprement parler) : vérification directe du rôle,
     * même approche que RapportController pour le Gérant.
     */
    private function autoriserSuperAdminSeul(): void
    {
        if (! Auth::user()->hasRole('super_admin')) {
            throw new AccessDeniedHttpException('Réservé au Super Admin.');
        }
    }

    /**
     * Statistiques globales de la plateforme : nombre de boutiques (actives/suspendues),
     * nombre d'utilisateurs, chiffre d'affaires cumulé toutes boutiques confondues.
     * Pas de "revenu plateforme" (abonnements) : cette notion n'existe pas dans le mémoire,
     * volontairement absente ici comme partout ailleurs dans le projet.
     */
    public function statistiques(): JsonResponse
    {
        $this->autoriserSuperAdminSeul();

        $totalBoutiques = Boutique::count();
        $boutiquesActives = Boutique::where('statut', 'active')->count();

        return response()->json([
            'total_boutiques' => $totalBoutiques,
            'boutiques_actives' => $boutiquesActives,
            'boutiques_suspendues' => $totalBoutiques - $boutiquesActives,
            'total_utilisateurs' => User::count(),
            'chiffre_affaires_cumule' => (float) Commande::where('type', 'vente')
                ->where('statut', 'validee')
                ->sum('montant_ttc'),
            'ventes_totales' => Commande::where('type', 'vente')
                ->where('statut', 'validee')
                ->count(),
        ]);
    }

    /**
     * Journal d'activité (Tableau 6, Super Admin). Par défaut, n'affiche que les entrées
     * du jour — un journal d'audit qui remonte à la création de la plateforme par défaut
     * serait illisible et peu utile au quotidien.
     * Les paramètres date_debut/date_fin (format YYYY-MM-DD) permettent de consulter une
     * période précise à la place ; fournir seulement l'un des deux borne la période ouverte
     * dans l'autre sens (ex: date_debut seul = "depuis cette date jusqu'à aujourd'hui").
     */
    public function journal(Request $request): JsonResponse
    {
        $this->autoriserSuperAdminSeul();

        $request->validate([
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
        ]);

        $query = ActivityLog::query()->with(['user:id,nom,prenom', 'boutique:id,nom']);

        if ($request->filled('boutique_id')) {
            $query->where('boutique_id', $request->integer('boutique_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->string('action') . '%');
        }

        if ($request->filled('date_debut') || $request->filled('date_fin')) {
            // Période explicitement demandée par l'utilisateur.
            $debut = $request->filled('date_debut')
                ? Carbon::parse($request->input('date_debut'))->startOfDay()
                : Carbon::parse($request->input('date_fin'))->startOfDay();

            $fin = $request->filled('date_fin')
                ? Carbon::parse($request->input('date_fin'))->endOfDay()
                : now()->endOfDay();

            $query->whereBetween('created_at', [$debut, $fin]);
        } else {
            // Par défaut : uniquement le jour courant.
            $query->whereDate('created_at', today());
        }

        return response()->json($query->latest()->paginate($request->integer('per_page', 30)));
    }
}