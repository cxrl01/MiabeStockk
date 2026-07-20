<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoutiqueRequest;
use App\Http\Requests\UpdateBoutiqueRequest;
use App\Models\Boutique;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BoutiqueController extends Controller
{
    use JournaliseActivite;

    /**
     * Boutiques du Gerant connecte (mode multi points de vente : plusieurs
     * possibles). Pour un membre du staff, la boutique unique a laquelle il
     * est rattache. Sert au selecteur de boutique active + a la page
     * Administration.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $boutiques = $user->hasRole('gerant')
            ? $user->boutiquesGerees()->get()
            : Boutique::where('id', $user->boutique_id)->get();

        return response()->json($boutiques);
    }

    public function store(StoreBoutiqueRequest $request): JsonResponse
    {
        $this->authorize('create', Boutique::class);

        $boutique = Boutique::create([
            ...$request->validated(),
            'gerant_id' => Auth::id(),
            'devise' => $request->validated('devise') ?? 'FCFA',
            'tva' => $request->validated('tva') ?? 0,
            'statut' => 'active',
        ]);

        $this->journaliser('boutique.creee', $boutique);

        return response()->json($boutique, 201);
    }

    public function show(Boutique $boutique): JsonResponse
    {
        $this->authorize('view', $boutique);

        return response()->json($boutique);
    }

    public function update(UpdateBoutiqueRequest $request, Boutique $boutique): JsonResponse
    {
        $this->authorize('update', $boutique);

        $boutique->update($request->validated());

        $this->journaliser('boutique.configuree', $boutique);

        return response()->json($boutique);
    }
}