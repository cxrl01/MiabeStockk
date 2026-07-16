<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProduitRequest;
use App\Http\Requests\UpdateProduitRequest;
use App\Models\Produit;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProduitController extends Controller
{
    use JournaliseActivite;

    private function baseQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $user = Auth::user();
        $query = Produit::query()->with('categorie');

        if ($user->hasRole('super_admin')) {
            //
        } elseif ($user->hasRole('gerant')) {
            $query->whereIn('boutique_id', $user->boutiquesGerees()->pluck('id'));
        } else {
            $query->where('boutique_id', $user->boutique_id);
        }

        return $query;
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Produit::class);

        $query = $this->baseQuery();

        if ($request->filled('boutique_id') && Auth::user()->hasRole('super_admin')) {
            $query->where('boutique_id', $request->integer('boutique_id'));
        }

        if ($request->filled('categorie_id')) {
            $query->where('categorie_id', $request->integer('categorie_id'));
        }

        if ($request->filled('recherche')) {
            $terme = $request->string('recherche');
            $query->where(fn ($q) => $q->where('nom', 'ilike', "%{$terme}%")
                ->orWhere('reference', 'ilike', "%{$terme}%"));
        }

        return response()->json($query->orderBy('nom')->paginate(20));
    }

    public function enAlerte(): JsonResponse
    {
        $this->authorize('viewAny', Produit::class);

        $produits = $this->baseQuery()
            ->whereColumn('quantite_stock', '<=', 'seuil_alerte')
            ->orderBy('quantite_stock')
            ->get();

        return response()->json($produits);
    }

    public function store(StoreProduitRequest $request): JsonResponse
    {
        $this->authorize('create', Produit::class);

        $user = Auth::user();
        $boutiqueId = $user->boutique_id ?? $request->integer('boutique_id');

        $produit = Produit::create([
            ...$request->validated(),
            'boutique_id' => $boutiqueId,
            'quantite_stock' => $request->integer('quantite_stock', 0),
        ]);

        $this->journaliser('produit.cree', $produit);

        return response()->json($produit, 201);
    }

    public function show(Produit $produit): JsonResponse
    {
        $this->authorize('view', $produit);

        return response()->json($produit->load(['categorie', 'mouvementsStock' => fn ($q) => $q->latest()->limit(20)]));
    }

    public function update(UpdateProduitRequest $request, Produit $produit): JsonResponse
    {
        $this->authorize('update', $produit);

        $produit->update($request->validated());

        $this->journaliser('produit.modifie', $produit);

        return response()->json($produit);
    }

    public function destroy(Produit $produit): JsonResponse
    {
        $this->authorize('delete', $produit);

        if ($produit->ligneCommandes()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un produit déjà utilisé dans des commandes. Envisagez de le désactiver.',
            ], 422);
        }

        $this->journaliser('produit.supprime', $produit, ['nom' => $produit->nom]);
        $produit->delete();

        return response()->json(null, 204);
    }
}