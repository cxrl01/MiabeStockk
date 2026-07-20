<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreEmployeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'boutique_id' => ['nullable', 'exists:boutiques,id'],
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:6'],
            // Libelle metier affiche (Caissiere, Magasinier...), separe du role RBAC.
            'poste' => ['nullable', 'string', 'max:100'],
            // Un Gerant ne peut creer que du personnel de sa boutique, jamais un
            // autre Gerant ni un Super Admin (Tableau 6 : lui seul gere les comptes).
            'role' => ['required', 'in:gestionnaire,commercial'],
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