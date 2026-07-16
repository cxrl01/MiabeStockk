<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'role_id', 'boutique_id', 'nom', 'prenom', 'email', 'telephone',
        'password', 'poste', 'actif', 'multi_points_vente',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'actif' => 'boolean',
            'multi_points_vente' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    // Boutique unique pour un membre du staff (Gestionnaire/Commercial).
    // Pour un Gérant, voir plutôt boutiquesGerees().
    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    // Boutiques possédées par un Gérant (relation 1,n).
    public function boutiquesGerees(): HasMany
    {
        return $this->hasMany(Boutique::class, 'gerant_id');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function hasRole(string $nom): bool
    {
        return $this->role?->nom === $nom;
    }

    // Utilisé par les policies pour vérifier qu'un utilisateur a le droit
    // d'agir sur une ressource rattachée à une boutique donnée.
    public function appartientABoutique(int $boutiqueId): bool
    {
        if ($this->hasRole('super_admin')) {
            return true;
        }

        if ($this->hasRole('gerant')) {
            return $this->boutiquesGerees()->where('id', $boutiqueId)->exists();
        }

        return $this->boutique_id === $boutiqueId;
    }
}