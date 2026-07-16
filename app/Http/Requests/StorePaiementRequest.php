<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StorePaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'montant' => ['required', 'numeric', 'min:0.01'],
            'mode' => ['required', 'in:especes,mobile_money,virement,cheque'],
            'reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}