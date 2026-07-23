<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use App\Models\Paiement;
use App\Traits\JournaliseActivite;
use App\Traits\ResolveBoutiqueActive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientController extends Controller
{
    use JournaliseActivite;
    use ResolveBoutiqueActive;

    private function baseQuery()
    {
        $user = Auth::user();
        $query = Client::query();

        if ($user->hasRole('super_admin')) {
            //
        } else {
            $query->where('boutique_id', $this->boutiqueActive());
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

        $client = Client::create([
            ...$request->validated(),
            'boutique_id' => $this->boutiqueActive(),
        ]);

        $this->journaliser('client.cree', $client);

        return response()->json($client, 201);
    }

    /**
     * Fiche client complète : infos + stats (total acheté, total réglé) +
     * historique des ventes et des paiements, pour la page de détail.
     */
    public function show(Client $client): JsonResponse
    {
        $this->authorize('view', $client);

        $ventes = $client->commandes()
            ->where('type', 'vente')
            ->latest()
            ->get(['id', 'numero', 'montant_ttc', 'montant_paye', 'statut', 'statut_paiement', 'created_at']);

        $paiements = Paiement::query()
            ->whereIn('commande_id', $ventes->pluck('id'))
            ->with('commande:id,numero')
            ->latest()
            ->get();

        return response()->json([
            'client' => $client,
            'total_achete' => (float) $ventes->where('statut', 'validee')->sum('montant_ttc'),
            'total_paye' => (float) $ventes->where('statut', 'validee')->sum('montant_paye'),
            'ventes' => $ventes,
            'paiements' => $paiements,
        ]);
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