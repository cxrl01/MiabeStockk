<?php

use Illuminate\Support\Facades\Route;
use App\Mail\BienvenueGerant;
use App\Models\User;

Route::get('/preview-mail', function () {
    $user = User::with('boutiquesGerees')->first();

    if (!$user) {
        return 'Aucun utilisateur en base — crée un compte via /inscription d\'abord.';
    }

    return new BienvenueGerant($user);
});

// Catch-all : toute route qui n'est pas /api/* est servie par le SPA React,
// qui gère ensuite le routing côté client (react-router-dom).
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');