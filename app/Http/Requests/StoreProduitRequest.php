<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreProduitRequest extends FormRequest
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
            'quantite_stock' => ['nullable', 'integer', 'min:0'],
            'seuil_alerte' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'prix_vente.gte' => 'Le prix de vente doit être supérieur ou égal au prix d\'achat.',
        ];
    }
}