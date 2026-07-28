<?php

namespace App\Http\Requests;

use App\Traits\ResolveBoutiqueActive;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateCategorieRequest extends FormRequest
{
    use ResolveBoutiqueActive;

    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $categorie = $this->route('categorie');

        return [
            'nom' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'nom')
                    ->where('boutique_id', $this->boutiqueActive())
                    ->ignore($categorie->id),
            ],
        ];
    }
}