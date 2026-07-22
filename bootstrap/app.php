<?php

use App\Http\Middleware\CheckBoutiqueActive;
use App\Http\Middleware\CheckRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // Application 100% API/SPA : aucune route "login" Blade n'existe. Sans ceci,
        // Authenticate::redirectTo() appelle route('login') des qu'une requete non
        // authentifiee n'envoie pas "Accept: application/json" (cas d'une navigation
        // <a href> classique, ex: le lien "Imprimer la facture"), ce qui plante avec
        // RouteNotFoundException AVANT meme que shouldRenderJsonWhen ci-dessous ait
        // une chance de s'appliquer. On force donc l'absence de redirection : jamais
        // de route('login'), toujours un 401 JSON.
        $middleware->redirectGuestsTo(fn () => null);

        // Alias 'role:xxx' et 'boutique.active' utilisables dans les groupes
        // de routes.
        $middleware->alias([
            'role' => CheckRole::class,
            'boutique.active' => CheckBoutiqueActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();