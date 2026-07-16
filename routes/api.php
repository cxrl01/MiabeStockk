<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategorieController;
use App\Http\Controllers\Api\V1\MouvementStockController;
use App\Http\Controllers\Api\V1\PaiementController;
use App\Http\Controllers\Api\V1\ProduitController;
use App\Http\Controllers\Api\V1\ProfilController;
use App\Http\Controllers\Api\V1\VenteController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // --- Authentification (publique) ---
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    // --- Routes protégées (Sanctum) ---
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Profil de l'utilisateur connecté.
        Route::put('/profil', [ProfilController::class, 'update']);
        Route::put('/profil/mot-de-passe', [ProfilController::class, 'updatePassword']);

        Route::get('/rapports/dashboard', [\App\Http\Controllers\Api\V1\DashboardController::class, 'index']);

        // Ventes : apiResource restreint à index/store/show (pas d'update/destroy —
        // une vente validée ne se modifie pas, elle s'annule).
        Route::apiResource('ventes', VenteController::class)
            ->parameters(['ventes' => 'vente'])
            ->only(['index', 'store', 'show']);
        Route::post('/ventes/{vente}/annuler', [VenteController::class, 'annuler']);

        // Paiement partiel sur une commande (vente ou livraison).
        Route::post('/commandes/{commande}/paiements', [PaiementController::class, 'store']);

        // Catégories : CRUD complet.
        Route::apiResource('categories', CategorieController::class)
            ->parameters(['categories' => 'categorie']);

        // Produits : CRUD complet + route dédiée pour les alertes de seuil.
        Route::get('/produits/alertes', [ProduitController::class, 'enAlerte']);
        Route::apiResource('produits', ProduitController::class);

        // Mouvements de stock : historique par produit + ajustement manuel.
        Route::get('/produits/{produit}/mouvements', [MouvementStockController::class, 'index']);
        Route::post('/produits/{produit}/ajuster-stock', [MouvementStockController::class, 'store']);
    });
});