<x-mail::message>
# Bienvenue sur MiabéStock, {{ $prenom }} !

Votre compte Gérant est prêt. La boutique **{{ $nomBoutique }}** vous attend.

@if ($multiPointsVente)
Vous avez indiqué gérer **plusieurs points de vente** : vous pourrez ajouter et piloter vos succursales depuis votre espace.
@else
Vous démarrez avec **un seul point de vente**. Quand votre activité grandira, vous pourrez activer le mode multi-succursales.
@endif

<x-mail::button :url="$urlConnexion">
Accéder à ma caisse
</x-mail::button>

À très vite,<br>
L’équipe MiabéStock
</x-mail::message>
