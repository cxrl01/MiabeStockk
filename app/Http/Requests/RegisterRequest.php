<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // accessible sans être authentifié
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'nom_boutique' => ['required', 'string', 'max:255'],
            'multi_points_vente' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'multi_points_vente.required' => 'Indiquez si vous avez plusieurs points de vente.',
        ];
    }
}
