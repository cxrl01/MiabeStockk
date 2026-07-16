<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfilRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Traits\JournaliseActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ProfilController extends Controller
{
    use JournaliseActivite;

    public function update(UpdateProfilRequest $request): JsonResponse
    {
        $user = Auth::user();

        $user->update($request->validated());

        $this->journaliser('profil.mise_a_jour', $user);

        return response()->json([
            'user' => $user->fresh()->load('role', 'boutique', 'boutiquesGerees'),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = Auth::user();

        if (! Hash::check($request->validated('mot_de_passe_actuel'), $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors' => ['mot_de_passe_actuel' => ['Le mot de passe actuel est incorrect.']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        $this->journaliser('profil.mot_de_passe_modifie', $user);

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }
}