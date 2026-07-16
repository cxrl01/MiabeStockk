<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateCategorieRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $categorie = $this->route('categorie');

        return [
            'nom' => [
                'required', 'string', 'max:255',
                'unique:categories,nom,'.$categorie->id.',id,boutique_id,'.$categorie->boutique_id,
            ],
        ];
    }
}