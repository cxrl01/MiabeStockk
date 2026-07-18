<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreLivraisonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'boutique_id' => ['nullable', 'exists:boutiques,id'],
            'fournisseur_id' => ['required', 'exists:fournisseurs,id'],
            'mode_paiement' => ['nullable', 'in:especes,mobile_money,virement,cheque'],
            'montant_paye' => ['nullable', 'numeric', 'min:0'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.produit_id' => ['required', 'exists:produits,id'],
            'lignes.*.quantite' => ['required', 'integer', 'min:1'],
            'lignes.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'lignes.required' => 'Une livraison doit contenir au moins un produit.',
            'fournisseur_id.required' => 'Le fournisseur est obligatoire.',
        ];
    }
}