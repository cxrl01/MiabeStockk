<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreBoutiqueRequest extends FormRequest
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
            'devise' => ['nullable', 'string', 'max:10'],
            'tva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            // Pas de "statut" ici : une nouvelle boutique demarre toujours 'active'
            // par defaut (migration), et sa suspension est reservee au Super Admin.
        ];
    }
}