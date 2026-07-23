<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFournisseurRequest;
use App\Http\Requests\UpdateFournisseurRequest;
use App\Models\Commande;
use App\Models\Fournisseur;
use App\Traits\JournaliseActivite;
use App\Traits\ResolveBoutiqueActive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FournisseurController extends Controller
{
    use JournaliseActivite;
    use ResolveBoutiqueActive;

    private function baseQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $user = Auth::user();
        $query = Fournisseur::query();

        if ($user->hasRole('super_admin')) {
            //
        } else {
            $query->where('boutique_id', $this->boutiqueActive());
        }

        return $query;
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Fournisseur::class);

        $query = $this->baseQuery();

        if ($request->filled('boutique_id') && Auth::user()->hasRole('super_admin')) {
            $query->where('boutique_id', $request->integer('boutique_id'));
        }

        if ($request->filled('recherche')) {
            $terme = $request->string('recherche');
            $query->where('nom', 'ilike', "%{$terme}%");
        }

        return response()->json($query->orderBy('nom')->paginate($request->integer('per_page', 20)));
    }

    public function store(StoreFournisseurRequest $request): JsonResponse
    {
        $this->authorize('create', Fournisseur::class);

        $fournisseur = Fournisseur::create([
            ...$request->validated(),
            'boutique_id' => $this->boutiqueActive(),
        ]);

        $this->journaliser('fournisseur.cree', $fournisseur);

        return response()->json($fournisseur, 201);
    }

    public function show(Fournisseur $fournisseur): JsonResponse
    {
        $this->authorize('view', $fournisseur);

        // Requete directe sur Commande plutot qu'une relation Fournisseur::commandes()
        // dont je n'ai pas confirme l'existence sur ton modele Fournisseur reel.
        $livraisons = Commande::query()
            ->where('fournisseur_id', $fournisseur->id)
            ->where('type', 'livraison')
            ->latest()
            ->get(['id', 'numero', 'montant_ttc', 'montant_paye', 'statut', 'statut_paiement', 'created_at']);

        return response()->json([
            'fournisseur' => $fournisseur,
            'livraisons' => $livraisons,
        ]);
    }

    public function update(UpdateFournisseurRequest $request, Fournisseur $fournisseur): JsonResponse
    {
        $this->authorize('update', $fournisseur);

        $fournisseur->update($request->validated());

        $this->journaliser('fournisseur.modifie', $fournisseur);

        return response()->json($fournisseur);
    }

    public function destroy(Fournisseur $fournisseur): JsonResponse
    {
        $this->authorize('delete', $fournisseur);

        if (Commande::where('fournisseur_id', $fournisseur->id)->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un fournisseur ayant des livraisons enregistrées.',
            ], 422);
        }

        $this->journaliser('fournisseur.supprime', $fournisseur, ['nom' => $fournisseur->nom]);
        $fournisseur->delete();

        return response()->json(null, 204);
    }
}