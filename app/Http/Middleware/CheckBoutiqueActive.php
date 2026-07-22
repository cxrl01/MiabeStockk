<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckBoutiqueActive
{
    /**
     * Verifie a CHAQUE requete (pas seulement au login) que l'utilisateur a
     * encore acces a une boutique active. Sans ca, un gerant/staff deja
     * connecte au moment ou le Super Admin suspend sa boutique garde un
     * acces complet jusqu'a sa prochaine tentative de connexion.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->aAccesActif()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['message' => 'Boutique suspendue. Contactez le support.'], 403);
        }

        return $next($request);
    }
}