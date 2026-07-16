<?php

namespace App\Providers;

use App\Models\Categorie;
use App\Models\Commande;
use App\Models\Produit;
use App\Policies\CategoriePolicy;
use App\Policies\ProduitPolicy;
use App\Policies\VentePolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Commande sert vente + livraison ; VentePolicy couvre les deux car
        // les règles d'autorisation (boutique + rôle) sont les mêmes.
        Gate::policy(Commande::class, VentePolicy::class);
        Gate::policy(Categorie::class, CategoriePolicy::class);
        Gate::policy(Produit::class, ProduitPolicy::class);

        // Le lien de réinitialisation doit pointer vers la SPA React
        // (pas de route Blade "password.reset" dans cette architecture).
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.url')
                . '/reinitialiser-mot-de-passe?token=' . $token
                . '&email=' . urlencode($user->email);
        });
    }
}