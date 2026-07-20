<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateEmployeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $employeId = $this->route('employe')?->id;

        return [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $employeId],
            'telephone' => ['nullable', 'string', 'max:50'],
            // Mot de passe optionnel en modification : ne change que si rempli.
            'password' => ['nullable', 'string', 'min:6'],
            'poste' => ['nullable', 'string', 'max:100'],
            'role' => ['required', 'in:gestionnaire,commercial'],
            'actif' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'role.in' => 'Un employé ne peut être que Gestionnaire ou Commercial.',
        ];
    }
}