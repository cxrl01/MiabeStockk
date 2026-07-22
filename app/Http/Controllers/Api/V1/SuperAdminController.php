<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Boutique;
use App\Models\Commande;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class SuperAdminController extends Controller
{
    /**
     * Tableau 6 : "Consulter statistiques globales" et "Consulter journal
     * d'activite" n'appartiennent qu'au Super Admin. Pas de Policy dediee
     * (ni Statistique ni Journal ne sont des modeles Eloquent a proprement
     * parler) : verification directe du role, meme approche que
     * RapportController pour le Gerant.
     */
    private function autoriserSuperAdminSeul(): void
    {
        if (! Auth::user()->hasRole('super_admin')) {
            throw new AccessDeniedHttpException('Réservé au Super Admin.');
        }
    }

    /**
     * Statistiques globales de la plateforme : nombre de boutiques (actives/
     * suspendues), nombre d'utilisateurs, chiffre d'affaires cumule toutes
     * boutiques confondues. Pas de "revenu plateforme" (abonnements) : cette
     * notion n'existe pas dans le memoire, volontairement absente ici comme
     * partout ailleurs dans le projet.
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
     * Journal d'activite (Tableau 6, Super Admin). Trace deja alimentee par
     * JournaliseActivite dans tous les controleurs — simple consultation
     * paginee ici, avec filtre optionnel par boutique ou par action.
     */
    public function journal(Request $request): JsonResponse
    {
        $this->autoriserSuperAdminSeul();

        $query = ActivityLog::query()->with(['user:id,nom,prenom', 'boutique:id,nom']);

        if ($request->filled('boutique_id')) {
            $query->where('boutique_id', $request->integer('boutique_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->string('action') . '%');
        }

        return response()->json($query->latest()->paginate($request->integer('per_page', 30)));
    }
}