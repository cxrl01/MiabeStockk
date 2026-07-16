<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateProduitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'categorie_id' => ['nullable', 'exists:categories,id'],
            'nom' => ['required', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'prix_achat' => ['required', 'numeric', 'min:0'],
            'prix_vente' => ['required', 'numeric', 'min:0', 'gte:prix_achat'],
            'taux_tva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'seuil_alerte' => ['nullable', 'integer', 'min:0'],
        ];
    }
}