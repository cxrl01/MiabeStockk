<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreCategorieRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $user = Auth::user();
        $boutiqueId = $user->boutique_id ?? $this->input('boutique_id');

        return [
            'nom' => [
                'required', 'string', 'max:255',
                'unique:categories,nom,NULL,id,boutique_id,'.$boutiqueId,
            ],
        ];
    }
}