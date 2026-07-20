<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeRequest;
use App\Http\Requests\UpdateEmployeRequest;
use App\Models\Role;
use App\Models\User;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class EquipeController extends Controller
{
    use JournaliseActivite;

    /**
     * Personnel (Gestionnaire, Commercial) des boutiques du Gerant connecte.
     * Contrairement a Produit/Client/Fournisseur, pas de cas Super Admin ni
     * staff ici : seul un Gerant appelle ces routes (verrouille par la Policy).
     */
    private function baseQuery(User $gerant): \Illuminate\Database\Eloquent\Builder
    {
        return User::query()
            ->whereIn('boutique_id', $gerant->boutiquesGerees()->pluck('id'))
            ->whereHas('role', fn ($q) => $q->whereIn('nom', ['gestionnaire', 'commercial']));
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = $this->baseQuery(Auth::user())->with('role');

        if ($request->filled('boutique_id')) {
            $query->where('boutique_id', $request->integer('boutique_id'));
        }

        return response()->json($query->orderBy('nom')->get());
    }

    public function store(StoreEmployeRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $gerant = Auth::user();

        try {
            $boutique = $request->filled('boutique_id')
                ? $gerant->boutiquesGerees()->findOrFail($request->integer('boutique_id'))
                : $gerant->boutiquesGerees()->firstOr(function () {
                    throw new RuntimeException('Aucune boutique associée à ce compte gérant.');
                });
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $role = Role::where('nom', $request->validated('role'))->firstOrFail();

        $employe = User::create([
            'boutique_id' => $boutique->id,
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