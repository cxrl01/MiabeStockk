<?php

use Illuminate\Support\Facades\Route;
use App\Mail\BienvenueGerant;
use App\Models\User;

// Route de test d'email (accessible uniquement en local / dev)
Route::get('/preview-mail', function () {
    $user = User::with('boutiquesGerees')->first();

    if (!$user) {
        return 'Aucun utilisateur en base — crée un compte d\'abord.';
    }

    return new BienvenueGerant($user);
});

/*
|--------------------------------------------------------------------------
| Catch-All SPA React (Mono-service)
|--------------------------------------------------------------------------
| Sert le fichier `public/build/index.html` généré par `npm run build`.
| - N'intercepte PAS les routes `/api/*` et `/sanctum/*`.
| - Exclu aussi `/preview-mail` pour que la route ci-dessus réponde.
*/
Route::get('/{any}', function () {
    $chemin = public_path('build/index.html');

    if (! file_exists($chemin)) {
        abort(404, 'Frontend non compilé — vérifie que Vite a bien généré public/build/index.html');
    }

    return response()->file($chemin);
})->where('any', '^(?!api|sanctum|preview-mail).*$');