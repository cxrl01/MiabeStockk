<?php

namespace App\Providers;

use App\Models\Categorie;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Produit;
use App\Models\User;
use App\Policies\CategoriePolicy;
use App\Policies\ClientPolicy;
use App\Policies\ProduitPolicy;
use App\Policies\VentePolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use App\Policies\EquipePolicy;
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
        Gate::policy(Client::class, ClientPolicy::class);
        Gate::policy(User::class, EquipePolicy::class);

        // Le lien de réinitialisation doit pointer vers la SPA React
        // (pas de route Blade "password.reset" dans cette architecture).
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.url')
                . '/reinitialiser-mot-de-passe?token=' . $token
                . '&email=' . urlencode($user->email);
        });

        // Contenu du mail en français, cohérent avec le reste de l'appli
        // (au lieu du texte anglais par défaut de Laravel). Hérite
        // automatiquement du thème MiabéStock déjà personnalisé
        // (resources/views/vendor/mail/html/themes/default.css).
        ResetPassword::toMailUsing(function ($notifiable, string $url) {
            return (new MailMessage)
                ->subject('Réinitialisation de votre mot de passe — MiabéStock')
                ->greeting('Bonjour ' . $notifiable->prenom . ',')
                ->line('Vous recevez cet e-mail car une demande de réinitialisation de mot de passe a été faite pour votre compte.')
                ->action('Réinitialiser mon mot de passe', $url)
                ->line('Ce lien expirera dans 60 minutes.')
                ->line('Si vous n\'êtes pas à l\'origine de cette demande, aucune action n\'est requise.');
        });


    }
}