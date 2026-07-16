<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = ['boutique_id', 'nom', 'telephone', 'adresse', 'dette'];

    protected function casts(): array
    {
        return ['dette' => 'decimal:2'];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class);
    }
}