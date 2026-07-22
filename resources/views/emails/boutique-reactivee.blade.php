@component('mail::message')
# Bonjour {{ $prenom }},

Bonne nouvelle : votre boutique **{{ $nomBoutique }}** a été réactivée par l'administration de MiabéStock. Votre personnel peut de nouveau accéder à l'application normalement.

@component('mail::button', ['url' => $urlConnexion])
Se connecter
@endcomponent

Cordialement,<br>
{{ config('app.name') }}
@endcomponent