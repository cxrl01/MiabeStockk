<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategorieController;
use App\Http\Controllers\Api\V1\FournisseurController;
use App\Http\Controllers\Api\V1\LivraisonController;
use App\Http\Controllers\Api\V1\MouvementStockController;
use App\Http\Controllers\Api\V1\PaiementController;
use App\Http\Controllers\Api\V1\ProduitController;
use App\Http\Controllers\Api\V1\ProfilController;
use App\Http\Controllers\Api\V1\VenteController;
use App\Http\Controllers\Api\V1\EquipeController;
use App\Http\Controllers\Api\V1\DepenseController;
use App\Http\Controllers\Api\V1\RapportController;
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
        Route::get('/ventes/{vente}/facture', [VenteController::class, 'facture']);

        // Paiement partiel sur une commande (vente ou livraison).
        Route::post('/commandes/{commande}/paiements', [PaiementController::class, 'store']);
        Route::get('/paiements/{paiement}/recu', [PaiementController::class, 'recu']);

        // Catégories : CRUD complet.
        Route::apiResource('categories', CategorieController::class)
            ->parameters(['categories' => 'categorie']);

        // Produits : CRUD complet + route dédiée pour les alertes de seuil.
        Route::get('/produits/alertes', [ProduitController::class, 'enAlerte']);
        Route::apiResource('produits', ProduitController::class);

        // Mouvements de stock : historique par produit + ajustement manuel.
        Route::get('/produits/{produit}/mouvements', [MouvementStockController::class, 'index']);
        Route::post('/produits/{produit}/ajuster-stock', [MouvementStockController::class, 'store']);

        Route::apiResource('clients', \App\Http\Controllers\Api\V1\ClientController::class);

        // Fournisseurs : CRUD complet (Tableau 6 : Gérant + Gestionnaire, via
        // FournisseurPolicy). Livraisons restreintes à index/store/show — comme
        // les ventes, une livraison validée ne se modifie pas.
        Route::apiResource('fournisseurs', FournisseurController::class);
        Route::apiResource('livraisons', LivraisonController::class)
            ->only(['index', 'store', 'show']);
        
        Route::apiResource('equipe', EquipeController::class)
            ->parameters(['equipe' => 'employe']);
         
        Route::get('/depenses/tresorerie', [DepenseController::class, 'tresorerie']);
            Route::apiResource('depenses', DepenseController::class);

        Route::get('/rapports/statistiques', [RapportController::class, 'statistiques']);
        Route::get('/rapports/resultat-net', [RapportController::class, 'resultatNet']);
        Route::get('/rapports/export-pdf', [RapportController::class, 'exportPdf']);
    });
});