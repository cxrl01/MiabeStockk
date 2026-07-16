<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class Produit extends Model
{
    use HasFactory;

    protected $fillable = [
        'boutique_id', 'categorie_id', 'nom', 'reference',
        'prix_achat', 'prix_vente', 'taux_tva', 'quantite_stock', 'seuil_alerte',
    ];

    protected function casts(): array
    {
        return [
            'prix_achat' => 'decimal:2',
            'prix_vente' => 'decimal:2',
            'taux_tva' => 'decimal:2',
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Categorie::class);
    }

    public function mouvementsStock(): HasMany
    {
        return $this->hasMany(MouvementStock::class);
    }

    public function ligneCommandes(): HasMany
    {
        return $this->hasMany(LigneCommande::class);
    }

    public function estEnAlerte(): bool
    {
        return $this->quantite_stock <= $this->seuil_alerte;
    }

    /**
     * Diminue le stock (sortie, ex: vente validée) et trace le mouvement.
     * Lève une exception si le stock devient négatif — la contrainte CHECK
     * en base agit comme filet de sécurité en plus de cette vérification.
     */
    public function reduireStock(int $quantite, ?Commande $commande = null, string $motif = 'vente'): MouvementStock
    {
        if ($quantite <= 0) {
            throw new RuntimeException('La quantité doit être positive.');
        }

        if ($this->quantite_stock < $quantite) {
            throw new RuntimeException("Stock insuffisant pour le produit {$this->nom}.");
        }

        $avant = $this->quantite_stock;
        $this->decrement('quantite_stock', $quantite);

        return $this->mouvementsStock()->create([
            'commande_id' => $commande?->id,
            'type' => 'sortie',
            'quantite' => $quantite,
            'quantite_avant' => $avant,
            'quantite_apres' => $avant - $quantite,
            'motif' => $motif,
            'user_id' => Auth::id(),
        ]);
    }

    /**
     * Augmente le stock (entrée, ex: livraison reçue ou annulation de vente
     * qui réintègre le stock) et trace le mouvement.
     */
    public function augmenterStock(int $quantite, ?Commande $commande = null, string $motif = 'livraison'): MouvementStock
    {
        if ($quantite <= 0) {
            throw new RuntimeException('La quantité doit être positive.');
        }

        $avant = $this->quantite_stock;
        $this->increment('quantite_stock', $quantite);

        return $this->mouvementsStock()->create([
            'commande_id' => $commande?->id,
            'type' => 'entree',
            'quantite' => $quantite,
            'quantite_avant' => $avant,
            'quantite_apres' => $avant + $quantite,
            'motif' => $motif,
            'user_id' => Auth::id(),
        ]);
    }
}