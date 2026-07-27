<?php

namespace App\Providers;

use App\Mail\Transport\BrevoTransport;
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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Enregistre le transport custom pour envoyer les emails via
        // l'API HTTP de Brevo (contourne le blocage des ports SMTP
        // sortants sur le plan gratuit Render).
        Mail::extend('brevo', function (array $config = []) {
            return new BrevoTransport(config('services.brevo.key'));
        });

        // Commande sert vente + livraison ; VentePolicy couvre les deux car
        // les règles d'autorisation (boutique + rôle) sont les mêmes.
        Gate::policy(Commande::class, VentePolicy::class);
        Gate::policy(Categorie::class, CategoriePolicy::class);
        Gate::policy(Produit::class, ProduitPolicy::class);
        Gate::policy(Client::class, ClientPolicy::class);
        Gate::policy(User::class, EquipePolicy::class);

        // Le lien de réinitialisation doit pointer vers la SPA React
        // (pas de route Blade "password.reset" dans cette architecture).
        //
        // IMPORTANT : quand toMailUsing() est défini (ci-dessous), Laravel
        // n'appelle JAMAIS createUrlUsing() en interne — le callback
        // toMailUsing reçoit directement le TOKEN BRUT (pas une URL toute
        // construite). On construit donc l'URL nous-mêmes ici, dans
        // toMailUsing, plutôt que de définir createUrlUsing séparément
        // (qui serait mort, jamais exécuté).
        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $baseUrl = rtrim(config('services.frontend_url'), '/');

            $url = $baseUrl
                . '/reinitialiser-mot-de-passe?token=' . $token
                . '&email=' . urlencode($notifiable->email);

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