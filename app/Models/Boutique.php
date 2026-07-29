<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Boutique extends Model
{
    use HasFactory;

    protected $fillable = ['gerant_id', 'nom', 'adresse', 'telephone', 'logo', 'devise', 'tva', 'statut'];

    protected $appends = ['logo_url'];

    protected function casts(): array
    {
        return [
            'tva' => 'decimal:2',
        ];
    }

    /**
     * URL publique du logo (affiche sur factures/recus). Null si aucun
     * logo n'est defini.
     */
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? Storage::disk('public')->url($this->logo) : null;
    }

    /**
     * Version base64 du logo, pour l'embarquer directement dans les PDF
     * (DomPDF ne charge pas toujours correctement les images via chemin
     * ou URL selon l'environnement — le base64 est fiable partout).
     * Volontairement absent de $appends : ne sert que cote serveur pour
     * generer les PDF, inutile dans les reponses JSON de l'API.
     */
    public function getLogoBase64Attribute(): ?string
    {
        if (! $this->logo || ! Storage::disk('public')->exists($this->logo)) {
            return null;
        }

        $contenu = Storage::disk('public')->get($this->logo);
        $mime = Storage::disk('public')->mimeType($this->logo);

        return 'data:' . $mime . ';base64,' . base64_encode($contenu);
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