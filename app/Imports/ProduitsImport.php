<?php

namespace App\Imports;

use App\Models\Categorie;
use App\Models\Produit;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Validators\Failure;
use Throwable;

/**
 * Import en masse du catalogue produits depuis un fichier Excel/CSV.
 * Tolère les variations d'en-tête (accents, "de"/"d'", casse) et les
 * formats de nombre à la française. Aucune ligne en échec ne stoppe
 * l'import global : tout est collecté dans $erreurs.
 */
class ProduitsImport implements
    ToCollection,
    WithHeadingRow,
    WithValidation,
    SkipsEmptyRows,
    SkipsOnError,
    SkipsOnFailure
{
    use Importable;

    private int $boutiqueId;
    public int $nombreImportes = 0;
    public int $nombreIgnores = 0;
    public array $erreurs = [];

    private array $categoriesCache = [];

    /** Alias de colonnes -> clé canonique (comparaison insensible à la casse) */
    private const ALIAS_COLONNES = [
        'prix_de_vente'    => 'prix_vente',
        'prix_vente_fcfa'  => 'prix_vente',
        'prix_dachat'      => 'prix_achat',
        'prix_d_achat'     => 'prix_achat',
        'prix_achat_fcfa'  => 'prix_achat',
        'qte_stock'        => 'quantite_stock',
        'stock'            => 'quantite_stock',
        'alerte'           => 'seuil_alerte',
        'ref'              => 'reference',
        'categorie_produit' => 'categorie',
    ];

    private const CHAMPS_NUMERIQUES = ['prix_achat', 'prix_vente', 'quantite_stock', 'seuil_alerte'];

    public function __construct(int $boutiqueId)
    {
        $this->boutiqueId = $boutiqueId;
    }

    public function collection(Collection $lignes): void
    {
        foreach ($lignes as $index => $ligne) {
            $numeroLigne = $index + 2;
            $data = $this->normaliser($ligne->toArray());

            try {
                $nom = trim((string) ($data['nom'] ?? ''));
                if ($nom === '') {
                    $this->ignorer($numeroLigne, 'nom manquant.');
                    continue;
                }

                if (!isset($data['prix_vente']) || $data['prix_vente'] === null) {
                    $this->ignorer($numeroLigne, 'prix de vente manquant ou illisible.');
                    continue;
                }

                $categorieId = null;
                $nomCategorie = trim((string) ($data['categorie'] ?? ''));
                if ($nomCategorie !== '') {
                    $categorieId = $this->resoudreCategorie($nomCategorie, $numeroLigne);
                }

                $reference = trim((string) ($data['reference'] ?? ''));
                $reference = $reference !== '' ? $reference : null;

                $attributs = [
                    'boutique_id'    => $this->boutiqueId,
                    'categorie_id'   => $categorieId,
                    'nom'            => $nom,
                    'reference'      => $reference,
                    'prix_achat'     => $data['prix_achat'] ?? 0.0,
                    'prix_vente'     => $data['prix_vente'],
                    'quantite_stock' => (int) ($data['quantite_stock'] ?? 0),
                    'seuil_alerte'   => (int) ($data['seuil_alerte'] ?? 5),
                ];

                // Référence déjà existante pour cette boutique -> mise à jour
                // plutôt qu'échec sur contrainte unique.
                if ($reference !== null) {
                    $produit = Produit::where('boutique_id', $this->boutiqueId)
                        ->where('reference', $reference)
                        ->first();

                    if ($produit) {
                        $produit->update($attributs);
                        $this->nombreImportes++;
                        continue;
                    }
                }

                Produit::create($attributs);
                $this->nombreImportes++;
            } catch (QueryException $e) {
                $this->ignorer($numeroLigne, $this->messageErreurSql($e));
            } catch (Throwable $e) {
                $this->ignorer($numeroLigne, $e->getMessage());
            }
        }
    }

    private function ignorer(int $numeroLigne, string $message): void
    {
        $this->nombreIgnores++;
        $this->erreurs[] = "Ligne {$numeroLigne} : {$message}";
    }

    /**
     * Normalise une ligne : clés (alias + insensible à la casse), texte
     * (trim), nombres (espaces, devise, virgule décimale française).
     */
    private function normaliser(array $data): array
    {
        $clesMinuscules = [];
        foreach (array_keys($data) as $cle) {
            $clesMinuscules[mb_strtolower(trim((string) $cle))] = $cle;
        }

        foreach (self::ALIAS_COLONNES as $depuisMin => $vers) {
            if (!isset($clesMinuscules[$depuisMin])) {
                continue;
            }
            $versMin = mb_strtolower($vers);
            if (!isset($clesMinuscules[$versMin])) {
                $data[$vers] = $data[$clesMinuscules[$depuisMin]];
                $clesMinuscules[$versMin] = $vers;
            }
        }

        foreach (['nom', 'reference', 'categorie'] as $champ) {
            if (isset($data[$champ]) && is_string($data[$champ])) {
                $data[$champ] = trim($data[$champ]);
            }
        }

        foreach (self::CHAMPS_NUMERIQUES as $champ) {
            if (array_key_exists($champ, $data)) {
                $data[$champ] = $this->versNombre($data[$champ]);
            }
        }

        return $data;
    }

    /** Convertit une valeur "sale" en float, ou null si illisible. */
    private function versNombre($valeur): ?float
    {
        if ($valeur === null || $valeur === '') {
            return null;
        }
        if (is_int($valeur) || is_float($valeur)) {
            return (float) $valeur;
        }

        $texte = trim(str_replace(["\xc2\xa0", ' ', 'FCFA', 'F CFA', 'XOF', '€', '$'], '', (string) $valeur));

        if (preg_match('/^-?\d+,\d+$/', $texte)) {
            $texte = str_replace(',', '.', $texte); // format FR "15000,50"
        }

        return is_numeric($texte) ? (float) $texte : null;
    }

    private function resoudreCategorie(string $nom, int $numeroLigne): ?int
    {
        $cle = mb_strtolower($nom);

        if (isset($this->categoriesCache[$cle])) {
            return $this->categoriesCache[$cle];
        }

        try {
            $categorie = Categorie::firstOrCreate(
                ['boutique_id' => $this->boutiqueId, 'nom' => $nom]
            );
            return $this->categoriesCache[$cle] = $categorie->id;
        } catch (Throwable $e) {
            $this->erreurs[] = "Ligne {$numeroLigne} : catégorie « {$nom} » invalide, produit importé sans catégorie.";
            return null;
        }
    }

    /**
     * Traduit un code d'erreur SQL PostgreSQL (SQLSTATE, portable) en
     * message compréhensible pour l'utilisateur.
     */
    private function messageErreurSql(QueryException $e): string
    {
        $sqlState = $e->errorInfo[0] ?? null;

        return match ($sqlState) {
            '23505' => 'référence déjà utilisée pour cette boutique.',   // unique_violation
            '23503' => 'catégorie ou boutique invalide.',                // foreign_key_violation
            '23502' => 'un champ obligatoire est manquant en base.',     // not_null_violation
            '22003' => 'valeur numérique hors limites (prix ou quantité trop grand).', // numeric_value_out_of_range
            default => 'erreur base de données lors de l\'enregistrement.',
        };
    }

    /** Normalise chaque ligne avant que WithValidation ne l'évalue. */
    public function prepareForValidation($data, $index)
    {
        return $this->normaliser($data);
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'prix_vente' => ['nullable', 'numeric', 'min:0'],
            'prix_achat' => ['nullable', 'numeric', 'min:0'],
            'quantite_stock' => ['nullable', 'integer', 'min:0'],
            'seuil_alerte' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            'nom.required' => 'le nom du produit est obligatoire.',
            'prix_vente.numeric' => 'le prix de vente doit être un nombre.',
            'prix_achat.numeric' => "le prix d'achat doit être un nombre.",
        ];
    }

    /** Empêche une ligne invalide de stopper tout l'import. */
    public function onFailure(Failure ...$failures): void
    {
        foreach ($failures as $failure) {
            $this->ignorer($failure->row(), implode(' ', $failure->errors()));
        }
    }

    /** Empêche une exception imprévue de stopper tout l'import. */
    public function onError(Throwable $e): void
    {
        $this->nombreIgnores++;
        $this->erreurs[] = 'Erreur inattendue : '.$e->getMessage();
    }
}