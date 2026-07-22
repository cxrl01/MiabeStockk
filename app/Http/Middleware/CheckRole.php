<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Bloque l'accès si l'utilisateur authentifié n'a pas l'un des rôles
     * autorisés. Toujours utilisé après 'auth:sanctum' dans la définition
     * des routes, donc $request->user() est garanti non-null ici — mais
     * on vérifie quand même par défense en profondeur.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $utilisateur = $request->user();

        if (!$utilisateur) {
            abort(403, "Accès non autorisé.");
        }

        $autorise = collect($roles)->contains(fn (string $role) => $utilisateur->hasRole($role));

        if (!$autorise) {
            abort(403, "Accès non autorisé.");
        }

        return $next($request);
    }
}