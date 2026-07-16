<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreAjustementStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:entree,sortie'],
            'quantite' => ['required', 'integer', 'min:1'],
            'motif' => ['required', 'string', 'max:255'],
        ];
    }
}