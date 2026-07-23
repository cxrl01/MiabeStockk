<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategorieRequest;
use App\Http\Requests\UpdateCategorieRequest;
use App\Models\Categorie;
use App\Traits\JournaliseActivite;
use App\Traits\ResolveBoutiqueActive;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CategorieController extends Controller
{
    use JournaliseActivite;
    use ResolveBoutiqueActive;

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Categorie::class);

        $user = Auth::user();

        $query = Categorie::query()->withCount('produits');

        if ($user->hasRole('super_admin')) {
            //
        } else {
            $query->where('boutique_id', $this->boutiqueActive());
        }

        return response()->json($query->orderBy('nom')->get());
    }

    public function store(StoreCategorieRequest $request): JsonResponse
    {
        $this->authorize('create', Categorie::class);

        $categorie = Categorie::create([
            'boutique_id' => $this->boutiqueActive(),
            'nom' => $request->validated('nom'),
        ]);

        $this->journaliser('categorie.creee', $categorie);

        return response()->json($categorie, 201);
    }

    public function show(Categorie $categorie): JsonResponse
    {
        $this->authorize('view', $categorie);

        return response()->json($categorie->load('produits'));
    }

    public function update(UpdateCategorieRequest $request, Categorie $categorie): JsonResponse
    {
        $this->authorize('update', $categorie);

        $categorie->update(['nom' => $request->validated('nom')]);

        $this->journaliser('categorie.modifiee', $categorie);

        return response()->json($categorie);
    }

    public function destroy(Categorie $categorie): JsonResponse
    {
        $this->authorize('delete', $categorie);

        if ($categorie->produits()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une catégorie qui contient des produits.',
            ], 422);
        }

        $this->journaliser('categorie.supprimee', $categorie, ['nom' => $categorie->nom]);
        $categorie->delete();

        return response()->json(null, 204);
    }
}