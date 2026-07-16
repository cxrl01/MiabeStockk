<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = ['commande_id', 'montant', 'mode', 'reference', 'user_id'];

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
        });

        static::created(function (Paiement $paiement) {
            $commande = $paiement->commande;
            $commande->increment('montant_paye', $paiement->montant);
            $commande->recalculerStatutPaiement();

            // Met à jour la dette du client si la commande est une vente à crédit.
            if ($commande->type === 'vente' && $commande->client) {
                $commande->client->decrement('dette', $paiement->montant);
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
}