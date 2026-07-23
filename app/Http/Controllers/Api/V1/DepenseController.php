<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepenseRequest;
use App\Http\Requests\UpdateDepenseRequest;
use App\Models\Depense;
use App\Traits\JournaliseActivite;
use App\Traits\ResolveBoutiqueActive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DepenseController extends Controller
{
    use JournaliseActivite;
    use ResolveBoutiqueActive;

    private function baseQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $user = Auth::user();
        $query = Depense::query();

        if ($user->hasRole('super_admin')) {
            //
        } else {
            $query->where('boutique_id', $this->boutiqueActive());
        }

        return $query;
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Depense::class);

        $query = $this->baseQuery()->with('user:id,nom,prenom');

        if ($request->filled('categorie')) {
            $query->where('categorie', $request->string('categorie'));
        }

        if ($request->filled('debut')) {
            $query->whereDate('date_depense', '>=', $request->date('debut'));
        }

        if ($request->filled('fin')) {
            $query->whereDate('date_depense', '<=', $request->date('fin'));
        }

        return response()->json($query->orderByDesc('date_depense')->paginate($request->integer('per_page', 20)));
    }

    /**
     * "Consulter tresorerie" (Tableau 6) : totaux et repartition par categorie
     * sur une periode (mois en cours par defaut).
     */
    public function tresorerie(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Depense::class);

        $debut = $request->filled('debut') ? $request->date('debut') : now()->startOfMonth();
        $fin = $request->filled('fin') ? $request->date('fin') : now()->endOfMonth();

        $depenses = $this->baseQuery()
            ->whereDate('date_depense', '>=', $debut)
            ->whereDate('date_depense', '<=', $fin)
            ->get();

        $repartition = $depenses
            ->groupBy(fn ($d) => $d->categorie ?? 'Non catégorisé')
            ->map(fn ($groupe, $categorie) => [
                'categorie' => $categorie,
                'total' => (float) $groupe->sum('montant'),
                'nombre' => $groupe->count(),
            ])
            ->values();

        return response()->json([
            'periode' => ['debut' => $debut->toDateString(), 'fin' => $fin->toDateString()],
            'total_depenses' => (float) $depenses->sum('montant'),
            'nombre_operations' => $depenses->count(),
            'repartition_categorie' => $repartition,
        ]);
    }

    public function store(StoreDepenseRequest $request): JsonResponse
    {
        $this->authorize('create', Depense::class);

        $user = Auth::user();
        $boutiqueId = $this->boutiqueActive();

        if (! $boutiqueId) {
            return response()->json(['message' => 'Aucune boutique associée à ce compte.'], 422);
        }

        $depense = Depense::create([
            ...$request->validated(),
            'boutique_id' => $boutiqueId,
            'user_id' => $user->id,
        ]);

        $this->journaliser('depense.creee', $depense, ['montant' => $depense->montant]);

        return response()->json($depense, 201);
    }

    public function show(Depense $depense): JsonResponse
    {
        $this->authorize('view', $depense);

        return response()->json($depense->load('user:id,nom,prenom'));
    }

    public function update(UpdateDepenseRequest $request, Depense $depense): JsonResponse
    {
        $this->authorize('update', $depense);

        $depense->update($request->validated());

        $this->journaliser('depense.modifiee', $depense);

        return response()->json($depense);
    }

    public function destroy(Depense $depense): JsonResponse
    {
        $this->authorize('delete', $depense);

        $this->journaliser('depense.supprimee', $depense, ['libelle' => $depense->libelle, 'montant' => $depense->montant]);
        $depense->delete();

        return response()->json(null, 204);
    }
}