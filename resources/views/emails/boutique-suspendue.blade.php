@component('mail::message')
# Bonjour {{ $prenom }},

Nous vous informons que votre boutique **{{ $nomBoutique }}** a été suspendue par l'administration de MiabéStock. Votre personnel n'a plus accès à l'application tant que la suspension est active.

**Motif communiqué :**
> {{ $motif }}

Si vous souhaitez plus d'informations ou contester cette décision, veuillez contacter notre support.

Cordialement,<br>
{{ config('app.name') }}
@endcomponent