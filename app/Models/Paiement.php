<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use RuntimeException;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = ['commande_id', 'numero_facture', 'montant', 'mode', 'reference', 'user_id'];

    protected function casts(): array
    {
        return ['montant' => 'decimal:2'];
    }

    protected static function booted(): void
    {
        static::creating(function (Paiement $paiement) {
            $commande = $paiement->commande ?? Commande::findOrFail($paiement->commande_id);

            if ($paiement->montant > $commande->solde()) {
                throw new RuntimeException('Le montant du paiement dépasse le solde restant dû.');
            }

            // Cas d'utilisation "Enregistrer un paiement" du mémoire : chaque paiement
            // génère sa propre facture numérotée, distincte de la facture de vente globale.
            $paiement->numero_facture ??= static::genererNumeroFacture();
        });

        static::created(function (Paiement $paiement) {
            $commande = $paiement->commande;
            $commande->increment('montant_paye', $paiement->montant);
            $commande->recalculerStatutPaiement();

            // "Suivre dette" (Tableau 6) : un paiement decremente la dette du cote
            // concerne selon le type de commande — le client pour une vente (ce qu'il
            // doit a la boutique), le fournisseur pour une livraison (ce que la
            // boutique lui doit). Les deux sens sont geres ici pour rester centralises,
            // symetrique de l'incrementation faite a la creation de la commande
            // (VenteController::store / LivraisonController::store) quand un solde
            // reste impaye.
            if ($commande->type === 'vente' && $commande->client) {
                $commande->client->decrement('dette', $paiement->montant);
            } elseif ($commande->type === 'livraison' && $commande->fournisseur) {
                $commande->fournisseur->decrement('dette', $paiement->montant);
            }
        });
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function genererNumeroFacture(): string
    {
        return sprintf('FAC-%s-%s', now()->format('Ymd'), strtoupper(Str::random(6)));
    }
}