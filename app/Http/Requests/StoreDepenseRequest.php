<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreDepenseRequest extends FormRequest
{
    /**
     * Categories volontairement interdites en depense : le cout des marchandises
     * recues est deja compte via Commande(type=livraison) et vient deja en
     * deduction du resultat net (formule du glossaire du memoire : "Resultat net
     * = CA - cout des livraisons - depenses"). Les autoriser ici doublerait ce
     * cout dans le calcul du resultat net.
     */
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