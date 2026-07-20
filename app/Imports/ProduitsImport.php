<?php

namespace App\Imports;

use App\Models\Categorie;
use App\Models\Produit;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

/**
 * Import en masse du catalogue produits depuis un fichier Excel/CSV.
 * Colonnes attendues (voir modèle téléchargeable) : nom, reference,
 * categorie, prix_achat, prix_vente, quantite_stock, seuil_alerte.
 *
 * ToCollection (plutôt que ToModel) pour pouvoir résoudre/créer la
 * catégorie par son nom avant l'insertion, et compter précisément
 * lignes importées vs lignes en erreur.
 */
class ProduitsImport implements ToCollection, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    use Importable;

    private int $boutiqueId;
    public int $nombreImportes = 0;
    public array $erreurs = [];

    // Cache local pour éviter de recréer/rechercher la même catégorie à
    // chaque ligne du fichier.
    private array $categoriesCache = [];

    public function __construct(int $boutiqueId)
    {
        $this->boutiqueId = $boutiqueId;
    }

    public function collection(Collection $lignes): void
    {
        foreach ($lignes as $index => $ligne) {
            $numeroLigne = $index + 2; // +1 pour l'en-tête, +1 pour l'index 0-based

            try {
                $categorieId = null;
                $nomCategorie = trim((string) ($ligne['categorie'] ?? ''));

                if ($nomCategorie !== '') {
                    $categorieId = $this->resoudreCategorie($nomCategorie);
                }

                Produit::create([
                    'boutique_id' => $this->boutiqueId,
                    'categorie_id' => $categorieId,
                    'nom' => trim((string) $ligne['nom']),
                    'reference' => $ligne['reference'] ?? null,
                    'prix_achat' => (float) ($ligne['prix_achat'] ?? 0),
                    'prix_vente' => (float) $ligne['prix_vente'],
                    'quantite_stock' => (int) ($ligne['quantite_stock'] ?? 0),
                    'seuil_alerte' => (int) ($ligne['seuil_alerte'] ?? 5),
                ]);

                $this->nombreImportes++;
            } catch (\Throwable $e) {
                $this->erreurs[] = "Ligne {$numeroLigne} : ".$e->getMessage();
            }
        }
    }

    private function resoudreCategorie(string $nom): int
    {
        $cle = mb_strtolower($nom);

        if (isset($this->categoriesCache[$cle])) {
            return $this->categoriesCache[$cle];
        }

        $categorie = Categorie::firstOrCreate(
            ['boutique_id' => $this->boutiqueId, 'nom' => $nom]
        );

        return $this->categoriesCache[$cle] = $categorie->id;
    }

    /**
     * Validation ligne par ligne — les lignes invalides sont écartées avec
     * un message clair plutôt que de faire échouer tout le fichier.
     */
    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'prix_vente' => ['required', 'numeric', 'min:0'],
            'prix_achat' => ['nullable', 'numeric', 'min:0'],
            'quantite_stock' => ['nullable', 'integer', 'min:0'],
            'seuil_alerte' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function onError(\Throwable $e): void
    {
        $this->erreurs[] = $e->getMessage();
    }
}