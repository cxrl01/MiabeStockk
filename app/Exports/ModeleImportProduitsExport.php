<?php

namespace App\Exports;

use App\Models\Produit;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ModeleImportProduitsExport implements FromCollection, WithHeadings
{
    protected $boutiqueId;

    public function __construct(int $boutiqueId)
    {
        $this->boutiqueId = $boutiqueId;
    }

    public function headings(): array
    {
        return ['nom', 'reference', 'categorie', 'prix_achat', 'prix_vente', 'quantite_stock', 'seuil_alerte'];
    }

    public function collection()
    {
        $produits = Produit::where('boutique_id', $this->boutiqueId)
            ->with('categorie')
            ->get();

        // Si la collection est vide, on renvoie la ligne d'exemple
        if ($produits->isEmpty()) {
            return collect([
                ['Riz 5kg', 'ALI-001', 'Alimentation', 2800, 3500, 40, 10]
            ]);
        }

        // Sinon, on renvoie les données réelles
        return $produits->map(function ($p) {
            return [
                $p->nom,
                $p->reference,
                $p->categorie->nom ?? 'N/A',
                $p->prix_achat,
                $p->prix_vente,
                $p->quantite_stock,
                $p->seuil_alerte,
            ];
        });
    }
}