<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ModeleImportProduitsExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return ['nom', 'reference', 'categorie', 'prix_achat', 'prix_vente', 'quantite_stock', 'seuil_alerte'];
    }

    public function collection()
    {
        return collect([
            ['Riz 5kg', 'ALI-001', 'Alimentation', 2800, 3500, 40, 10],
        ]);
    }
}