<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneCommande extends Model
{
    use HasFactory;

    protected $table = 'ligne_commandes';

    protected $fillable = [
        'commande_id', 'produit_id', 'quantite', 'prix_unitaire',
        'taux_tva', 'montant_ht', 'montant_ttc',
    ];

    protected function casts(): array
    {
        return [
            'prix_unitaire' => 'decimal:2',
            'taux_tva' => 'decimal:2',
            'montant_ht' => 'decimal:2',
            'montant_ttc' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (LigneCommande $ligne) {
            $ligne->montant_ht = round($ligne->quantite * $ligne->prix_unitaire, 2);
            $ligne->montant_ttc = round($ligne->montant_ht * (1 + $ligne->taux_tva / 100), 2);
        });
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class);
    }
}