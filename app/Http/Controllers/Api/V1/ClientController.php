<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientController extends Controller
{
    use JournaliseActivite;

    private function baseQuery()
    {
        $user = Auth::user();
        $query = Client::query();

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
        $this->authorize('viewAny', Client::class);

        $query = $this->baseQuery();

        if ($request->filled('recherche')) {
            $terme = $request->string('recherche');
            $query->where(fn ($q) => $q->where('nom', 'ilike', "%{$terme}%")
                ->orWhere('telephone', 'ilike', "%{$terme}%"));
        }

        return response()->json($query->orderBy('nom')->paginate(50));
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $user = Auth::user();
        $boutiqueId = $user->boutique_id ?? $request->integer('boutique_id');

        $client = Client::create([
            ...$request->validated(),
            'boutique_id' => $boutiqueId,
        ]);

        $this->journaliser('client.cree', $client);

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        $this->authorize('view', $client);

        return response()->json($client->load(['commandes' => fn ($q) => $q->latest()->limit(10)]));
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);

        $client->update($request->validated());

        $this->journaliser('client.modifie', $client);

        return response()->json($client);
    }

    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('delete', $client);

        if ($client->dette > 0) {
            return response()->json(['message' => 'Impossible de supprimer un client avec une dette active.'], 422);
        }

        if ($client->commandes()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer un client ayant un historique de ventes.'], 422);
        }

        $this->journaliser('client.supprime', $client, ['nom' => $client->nom]);
        $client->delete();

        return response()->json(null, 204);
    }
}