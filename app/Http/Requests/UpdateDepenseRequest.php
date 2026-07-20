<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateDepenseRequest extends FormRequest
{
    private const CATEGORIES_INTERDITES = ['achat stock', 'achats', 'stock', 'livraison', 'livraisons', 'fournisseur', 'fournisseurs', 'marchandise', 'marchandises'];

    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'libelle' => ['required', 'string', 'max:255'],
            'montant' => ['required', 'numeric', 'min:0.01'],
            'categorie' => ['nullable', 'string', 'max:100', function ($attribute, $value, $fail) {
                if ($value && in_array(mb_strtolower(trim($value)), self::CATEGORIES_INTERDITES, true)) {
                    $fail("Cette catégorie est réservée aux livraisons fournisseurs (module Fournisseurs), déjà comptée séparément dans le résultat net. Utilisez une autre catégorie (loyer, salaires, transport...).");
                }
            }],
            'date_depense' => ['required', 'date'],
        ];
    }
}