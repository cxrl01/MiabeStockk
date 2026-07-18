<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreFournisseurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'conditions_paiement' => ['nullable', 'string', 'max:255'],
            // Pas de "dette" ici volontairement : elle demarre a 0 et n'evolue que via
            // les livraisons (LivraisonController) et les paiements (Paiement::booted),
            // jamais par saisie manuelle directe.
        ];
    }
}