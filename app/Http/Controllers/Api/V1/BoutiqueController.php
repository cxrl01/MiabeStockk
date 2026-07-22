<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoutiqueRequest;
use App\Http\Requests\UpdateBoutiqueRequest;
use App\Mail\BoutiqueReactiveeMail;
use App\Mail\BoutiqueSupprimeeMail;
use App\Mail\BoutiqueSuspendueMail;
use App\Models\Boutique;
use App\Models\Commande;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class BoutiqueController extends Controller
{
    use JournaliseActivite;

    /**
     * Super Admin : toutes les boutiques de la plateforme (Tableau 6,
     * "Consulter liste des boutiques"), avec gerant + effectif + CA cumule.
     * Gerant : ses boutiques (mode multi points de vente). Staff : sa
     * boutique unique.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $boutiques = match (true) {
            $user->hasRole('super_admin') => Boutique::with('gerant:id,nom,prenom')
                ->withCount('staff')
                ->withSum(['commandes as ca_total' => function ($q) {
                    $q->where('type', 'vente')->where('statut', 'validee');
                }], 'montant_ttc')
                ->get(),
            $user->hasRole('gerant') => $user->boutiquesGerees()->get(),
            default => Boutique::where('id', $user->boutique_id)->get(),
        };

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

    /**
     * Fiche detail d'une boutique (utilisee par AdminBoutiqueDetail.jsx) :
     * gerant charge (avec email), effectif et CA cumule calcules — sans quoi
     * la page affiche gerant/staff_count/ca_total vides par defaut.
     */
    public function show(Boutique $boutique): JsonResponse
    {
        $this->authorize('view', $boutique);

        $boutique->load('gerant:id,nom,prenom,email')
            ->loadCount('staff')
            ->loadSum(['commandes as ca_total' => function ($query) {
                $query->where('type', 'vente')->where('statut', 'validee');
            }], 'montant_ttc');

        return response()->json($boutique);
    }

    public function update(UpdateBoutiqueRequest $request, Boutique $boutique): JsonResponse
    {
        $this->authorize('update', $boutique);

        $boutique->update($request->validated());

        $this->journaliser('boutique.configuree', $boutique);

        return response()->json($boutique);
    }

    /**
     * Tableau 6 : "Suspendre boutique" (Super Admin). Motif obligatoire,
     * trace dans le journal d'activite (metadata) + email au gerant. L'envoi
     * d'email est protege par try/catch : une panne SMTP ne doit pas faire
     * echouer l'action de suspension elle-meme (deja commit en base).
     */
    public function suspendre(Request $request, Boutique $boutique): JsonResponse
    {
        $this->authorize('suspendre', $boutique);

        $donnees = $request->validate([
            'motif' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if ($boutique->statut === 'suspendue') {
            return response()->json(['message' => 'Cette boutique est déjà suspendue.'], 422);
        }

        $boutique->update(['statut' => 'suspendue']);

        $this->journaliser('boutique.suspendue', $boutique, [
            'nom' => $boutique->nom,
            'motif' => $donnees['motif'],
        ]);

        if ($boutique->gerant?->email) {
            try {
                Mail::to($boutique->gerant->email)->send(
                    new BoutiqueSuspendueMail($boutique->gerant, $boutique->nom, $donnees['motif'])
                );
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json($boutique);
    }

    /**
     * Tableau 6 : "Réactiver boutique" (Super Admin). Pas de motif requis
     * (jamais ete le cas) + email au gerant pour l'informer du retour a la
     * normale.
     */
    public function reactiver(Boutique $boutique): JsonResponse
    {
        $this->authorize('reactiver', $boutique);

        if ($boutique->statut === 'active') {
            return response()->json(['message' => 'Cette boutique est déjà active.'], 422);
        }

        $boutique->update(['statut' => 'active']);

        $this->journaliser('boutique.reactivee', $boutique, ['nom' => $boutique->nom]);

        if ($boutique->gerant?->email) {
            try {
                Mail::to($boutique->gerant->email)->send(
                    new BoutiqueReactiveeMail($boutique->gerant, $boutique->nom)
                );
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json($boutique);
    }

    /**
     * Tableau 6 : "Supprimer boutique" (Super Admin). Refuse si la boutique a
     * deja de l'activite. Motif obligatoire + email au gerant avant
     * suppression effective (le gerant/la boutique n'existent plus apres
     * $boutique->delete()).
     */
    public function destroy(Request $request, Boutique $boutique): JsonResponse
    {
        $this->authorize('delete', $boutique);

        $donnees = $request->validate([
            'motif' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if (Commande::where('boutique_id', $boutique->id)->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une boutique ayant déjà des opérations enregistrées. Suspendez-la à la place.',
            ], 422);
        }

        $nomBoutique = $boutique->nom;
        $gerant = $boutique->gerant;

        $this->journaliser('boutique.supprimee', $boutique, [
            'nom' => $nomBoutique,
            'motif' => $donnees['motif'],
        ]);

        $boutique->delete();

        if ($gerant?->email) {
            try {
                Mail::to($gerant->email)->send(
                    new BoutiqueSupprimeeMail($gerant, $nomBoutique, $donnees['motif'])
                );
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json(null, 204);
    }
}