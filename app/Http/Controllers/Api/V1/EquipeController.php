<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeRequest;
use App\Http\Requests\UpdateEmployeRequest;
use App\Models\Role;
use App\Models\User;
use App\Traits\JournaliseActivite;
use App\Traits\ResolveBoutiqueActive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class EquipeController extends Controller
{
    use JournaliseActivite;
    use ResolveBoutiqueActive;

    /**
     * Personnel (Gestionnaire, Commercial) de la boutique ACTIVE du Gerant
     * connecte (header X-Boutique-Id) — plus le melange de tout le personnel
     * de toutes ses boutiques. Contrairement a Produit/Client/Fournisseur,
     * pas de cas Super Admin ni staff ici : seul un Gerant appelle ces routes
     * (verrouille par la Policy).
     */
    private function baseQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return User::query()
            ->where('boutique_id', $this->boutiqueActive())
            ->whereHas('role', fn ($q) => $q->whereIn('nom', ['gestionnaire', 'commercial']));
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = $this->baseQuery()->with('role');

        return response()->json($query->orderBy('nom')->get());
    }

    public function store(StoreEmployeRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $boutiqueId = $this->boutiqueActive();

        if (! $boutiqueId) {
            return response()->json(['message' => 'Aucune boutique associée à ce compte gérant.'], 422);
        }

        $role = Role::where('nom', $request->validated('role'))->firstOrFail();

        $employe = User::create([
            'boutique_id' => $boutiqueId,
            'role_id' => $role->id,
            'nom' => $request->validated('nom'),
            'prenom' => $request->validated('prenom'),
            'email' => $request->validated('email'),
            'telephone' => $request->validated('telephone'),
            'password' => $request->validated('password'), // hache automatiquement via le cast 'hashed' du modele
            'poste' => $request->validated('poste'),
            'actif' => true,
        ]);

        $this->journaliser('employe.cree', $employe, ['role' => $role->nom]);

        return response()->json($employe->load('role'), 201);
    }

    public function show(User $employe): JsonResponse
    {
        $this->authorize('view', $employe);

        return response()->json($employe->load('role'));
    }

    public function update(UpdateEmployeRequest $request, User $employe): JsonResponse
    {
        $this->authorize('update', $employe);

        $role = Role::where('nom', $request->validated('role'))->firstOrFail();

        $donnees = [
            'role_id' => $role->id,
            'nom' => $request->validated('nom'),
            'prenom' => $request->validated('prenom'),
            'email' => $request->validated('email'),
            'telephone' => $request->validated('telephone'),
            'poste' => $request->validated('poste'),
        ];

        if ($request->filled('actif')) {
            $donnees['actif'] = $request->boolean('actif');
        }

        if ($request->filled('password')) {
            $donnees['password'] = $request->validated('password'); // cast 'hashed'
        }

        $employe->update($donnees);

        $this->journaliser('employe.modifie', $employe);

        return response()->json($employe->fresh('role'));
    }

    public function destroy(User $employe): JsonResponse
    {
        $this->authorize('delete', $employe);

        // Un employe ayant deja cree des ventes/livraisons ne peut pas etre
        // supprime (integrite des donnees historiques) — le desactiver via
        // update() (actif=false) est l'alternative sure.
        if (\App\Models\Commande::where('user_id', $employe->id)->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un employé ayant déjà enregistré des opérations. Désactivez son compte à la place.',
            ], 422);
        }

        $this->journaliser('employe.supprime', $employe, ['nom' => $employe->nom]);
        $employe->delete();

        return response()->json(null, 204);
    }
}