@component('mail::message')
# Bonjour {{ $prenom }},

Nous vous informons que votre boutique **{{ $nomBoutique }}** a été supprimée de la plateforme MiabéStock par l'administration.

**Motif communiqué :**
> {{ $motif }}

Si vous pensez qu'il s'agit d'une erreur ou souhaitez plus d'informations, veuillez contacter notre support.

Cordialement,<br>
{{ config('app.name') }}
@endcomponent