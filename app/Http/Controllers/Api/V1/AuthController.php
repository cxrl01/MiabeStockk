<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\Boutique;
use App\Models\Role;
use App\Models\User;
use App\Traits\JournaliseActivite;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use JournaliseActivite;

    /**
     * Inscription en libre-service : crée le compte Gérant ET sa première
     * boutique en une seule transaction, puis ouvre directement une session
     * (Sanctum SPA — pas de token à renvoyer, tout passe par le cookie).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $role = Role::where('nom', 'gerant')->firstOrFail();

        $user = DB::transaction(function () use ($request, $role) {
            $user = User::create([
                'role_id' => $role->id,
                'nom' => $request->validated('nom'),
                'prenom' => $request->validated('prenom'),
                'email' => $request->validated('email'),
                'telephone' => $request->validated('telephone'),
                'password' => Hash::make($request->validated('password')),
            ]);

            Boutique::create([
                'gerant_id' => $user->id,
                'nom' => $request->validated('nom_boutique'),
                'statut' => 'active',
            ]);

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        $this->journaliser('auth.inscription', $user);

        return response()->json([
            'user' => $user->load('role', 'boutique', 'boutiquesGerees'),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->actif) {
            Auth::logout();

            return response()->json(['message' => 'Compte désactivé. Contactez votre gérant.'], 403);
        }

        if ($user->boutique_id && ! $user->boutique->isActive()) {
            Auth::logout();

            return response()->json(['message' => 'Boutique suspendue. Contactez le support.'], 403);
        }

        // Régénère l'ID de session après authentification (protection contre
        // la fixation de session) — remplace la création de token Bearer.
        $request->session()->regenerate();

        $this->journaliser('auth.login', $user);

        return response()->json([
            'user' => $user->load('role', 'boutique', 'boutiquesGerees'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = Auth::user();
        $this->journaliser('auth.logout', $user);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Déconnecté.']);
    }

    public function me(): JsonResponse
    {
        if (! Auth::check()) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        return response()->json(Auth::user()->load('role', 'boutique', 'boutiquesGerees'));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->only('email'));

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Lien de réinitialisation envoyé.'])
            : response()->json(['message' => 'Impossible d\'envoyer le lien.'], 400);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Mot de passe réinitialisé.'])
            : response()->json(['message' => 'Jeton invalide ou expiré.'], 400);
    }
}