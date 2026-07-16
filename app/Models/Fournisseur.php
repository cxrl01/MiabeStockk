<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fournisseur extends Model
{
    use HasFactory;

    protected $fillable = ['boutique_id', 'nom', 'telephone', 'adresse', 'conditions_paiement', 'dette'];

    protected function casts(): array
    {
        return ['dette' => 'decimal:2'];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    // Livraisons = commandes de type 'livraison' rattachées à ce fournisseur.
    public function livraisons(): HasMany
    {
        return $this->hasMany(Commande::class)->where('type', 'livraison');
    }
}