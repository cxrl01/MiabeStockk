<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaiementRequest;
use App\Models\Commande;
use App\Models\Paiement;
use App\Traits\JournaliseActivite;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class PaiementController extends Controller
{
    use JournaliseActivite;

    /**
     * Enregistre un paiement partiel ou total sur une commande.
     * La logique de mise à jour de montant_paye, statut_paiement et dette
     * client vit dans Paiement::booted() pour rester centralisée et évite
     * qu'un futur endpoint oublie de la répliquer. Paiement::booted() genere
     * aussi automatiquement numero_facture (chaque paiement a sa propre facture,
     * cf. cas d'utilisation "Enregistrer un paiement" du memoire).
     */
    public function store(StorePaiementRequest $request, Commande $commande): JsonResponse
    {
        $this->authorize('enregistrerPaiement', $commande);

        if ($commande->statut !== 'validee') {
            return response()->json(['message' => 'Seule une commande validée peut recevoir un paiement.'], 422);
        }

        try {
            $paiement = Paiement::create([
                'commande_id' => $commande->id,
                'montant' => $request->validated('montant'),
                'mode' => $request->validated('mode'),
                'reference' => $request->validated('reference'),
                'user_id' => Auth::id(),
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->journaliser('paiement.enregistre', $commande, ['montant' => $paiement->montant]);

        return response()->json($commande->fresh(['paiements']), 201);
    }

    /**
     * Genere le recu PDF d'un paiement individuel (distinct de la facture de
     * vente complete). Meme regle d'autorisation que la facture de vente
     * ("Genere PDF" au Tableau 6 : Gerant + Commercial), reutilisee via la
     * commande liee au paiement plutot que dupliquee dans une Policy separee.
     */
    public function recu(Paiement $paiement)
    {
        $this->authorize('genererPdf', $paiement->commande);

        $paiement->load(['commande.boutique', 'commande.client', 'user']);

        $pdf = Pdf::loadView('factures.recu', ['paiement' => $paiement]);

        return $pdf->stream("recu-{$paiement->numero_facture}.pdf");
    }
}