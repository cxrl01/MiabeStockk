<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreVenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Autorisation fine (rôle + boutique) déléguée à VentePolicy::create,
        // vérifiée explicitement dans le contrôleur.
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'client_id' => ['nullable', 'exists:clients,id'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.produit_id' => ['required', 'exists:produits,id'],
            'lignes.*.quantite' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'lignes.required' => 'Une vente doit contenir au moins un produit.',
            'lignes.*.quantite.min' => 'La quantité doit être d\'au moins 1.',
        ];
    }
}