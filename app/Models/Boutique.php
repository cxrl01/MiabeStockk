<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Boutique extends Model
{
    use HasFactory;

    protected $fillable = ['gerant_id', 'nom', 'adresse', 'telephone', 'logo', 'devise', 'tva', 'statut'];

    protected function casts(): array
    {
        return [
            'tva' => 'decimal:2',
        ];
    }

    // Un Gérant peut posséder plusieurs boutiques (relation 1,n retenue depuis le
    // texte du mémoire, en écart avec le 0..1 du diagramme de classe).
    public function gerant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'gerant_id');
    }

    public function staff(): HasMany
    {
        return $this->hasMany(User::class, 'boutique_id');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Categorie::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function fournisseurs(): HasMany
    {
        return $this->hasMany(Fournisseur::class);
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class);
    }

    public function depenses(): HasMany
    {
        return $this->hasMany(Depense::class);
    }

    public function isActive(): bool
    {
        return $this->statut === 'active';
    }
}