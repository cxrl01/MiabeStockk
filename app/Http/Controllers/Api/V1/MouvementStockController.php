<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAjustementStockRequest;
use App\Models\Produit;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class MouvementStockController extends Controller
{
    use JournaliseActivite;

    public function index(Produit $produit): JsonResponse
    {
        $this->authorize('view', $produit);

        return response()->json(
            $produit->mouvementsStock()->with('user:id,nom,prenom')->latest()->paginate(30)
        );
    }

    public function store(StoreAjustementStockRequest $request, Produit $produit): JsonResponse
    {
        $this->authorize('ajusterStock', $produit);

        $motif = 'ajustement: '.$request->validated('motif');

        try {
            if ($request->validated('type') === 'entree') {
                $mouvement = $produit->augmenterStock($request->validated('quantite'), null, $motif);
            } else {
                $mouvement = $produit->reduireStock($request->validated('quantite'), null, $motif);
            }
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->journaliser('stock.ajuste', $produit, [
            'type' => $request->validated('type'),
            'quantite' => $request->validated('quantite'),
            'motif' => $request->validated('motif'),
        ]);

        return response()->json($mouvement->load('produit'), 201);
    }
}