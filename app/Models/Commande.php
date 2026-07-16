<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class Commande extends Model
{
    use HasFactory;

    protected $fillable = [
        'boutique_id', 'type', 'numero', 'client_id', 'fournisseur_id', 'user_id',
        'montant_ht', 'montant_tva', 'montant_ttc', 'montant_paye',
        'statut', 'statut_paiement', 'annulee_at',
    ];
    
    protected $attributes = [
        'statut' => 'en_attente',
        'statut_paiement' => 'non_payee',
    ];

    protected function casts(): array
    {
        return [
            'montant_ht' => 'decimal:2',
            'montant_tva' => 'decimal:2',
            'montant_ttc' => 'decimal:2',
            'montant_paye' => 'decimal:2',
            'annulee_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Commande $commande) {
            $commande->numero ??= static::genererNumero($commande->type);
        });
    }

    public static function genererNumero(string $type): string
    {
        $prefixe = $type === 'vente' ? 'VTE' : 'LIV';

        return sprintf('%s-%s-%s', $prefixe, now()->format('Ymd'), strtoupper(Str::random(6)));
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneCommande::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function mouvementsStock(): HasMany
    {
        return $this->hasMany(MouvementStock::class);
    }

    /**
     * Recalcule montant_ht / montant_tva / montant_ttc à partir des lignes.
     * Appelée après ajout/modification des lignes de commande.
     */
    public function recalculerMontants(): void
    {
        $lignes = $this->lignes()->get();

        $this->montant_ht = $lignes->sum('montant_ht');
        $this->montant_tva = $lignes->sum(fn (LigneCommande $l) => $l->montant_ttc - $l->montant_ht);
        $this->montant_ttc = $lignes->sum('montant_ttc');
        $this->save();
    }

    public function recalculerStatutPaiement(): void
    {
        $solde = $this->solde();

        $this->statut_paiement = match (true) {
            $this->montant_paye <= 0 => 'non_payee',
            $solde <= 0 => 'payee',
            default => 'partielle',
        };
        $this->save();
    }

    public function solde(): float
    {
        return round($this->montant_ttc - $this->montant_paye, 2);
    }

    /**
     * Valide la commande : applique l'impact stock (sortie pour une vente,
     * entrée pour une livraison) ligne par ligne, chaque mouvement étant tracé
     * via Produit::reduireStock()/augmenterStock().
     */
    public function valider(): void
    {
        if ($this->statut !== 'en_attente') {
            throw new RuntimeException('Seule une commande en attente peut être validée.');
        }

        DB::transaction(function () {
            foreach ($this->lignes as $ligne) {
                if ($this->type === 'vente') {
                    $ligne->produit->reduireStock($ligne->quantite, $this, 'vente');
                } else {
                    $ligne->produit->augmenterStock($ligne->quantite, $this, 'livraison');
                }
            }

            $this->statut = 'validee';
            $this->save();
        });
    }

    /**
     * Annule une commande validée et réintègre le stock : pour une vente,
     * le stock est restitué (entrée) ; pour une livraison, le stock reçu est
     * retiré (sortie), pour rester cohérent avec l'effet inverse de valider().
     */
    public function annuler(): void
    {
        if ($this->statut !== 'validee') {
            throw new RuntimeException('Seule une commande validée peut être annulée.');
        }

        DB::transaction(function () {
            foreach ($this->lignes as $ligne) {
                if ($this->type === 'vente') {
                    $ligne->produit->augmenterStock($ligne->quantite, $this, 'annulation_vente');
                } else {
                    $ligne->produit->reduireStock($ligne->quantite, $this, 'annulation_livraison');
                }
            }

            $this->statut = 'annulee';
            $this->annulee_at = now();
            $this->save();
        });
    }
}