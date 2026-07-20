<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateBoutiqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'string', 'max:255'],
            'devise' => ['nullable', 'string', 'max:10'],
            'tva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            // Toujours pas de "statut" : "Suspendre/Reactiver boutique" (Tableau 6)
            // reste une action Super Admin, jamais accessible via ce formulaire Gerant.
        ];
    }
}