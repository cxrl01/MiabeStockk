<?php

namespace App\Policies;

use App\Models\Boutique;
use App\Models\User;

class BoutiquePolicy
{
    // Consultation ouverte a tout membre de la boutique (Dashboard, etc. en
    // ont besoin pour afficher le nom/devise/tva de leur boutique).
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Boutique $boutique): bool
    {
        return $user->appartientABoutique($boutique->id);
    }

    // Creer une boutique supplementaire : reserve au Gerant, et seulement
    // s'il a active le mode multi points de vente (users.multi_points_vente).
    public function create(User $user): bool
    {
        return $user->hasRole('gerant') && $user->multi_points_vente;
    }

    // Tableau 6 du memoire : "Configurer boutique" = Gerant seul, et
    // uniquement sur ses propres boutiques.
    public function update(User $user, Boutique $boutique): bool
    {
        return $user->hasRole('gerant')
            && $user->boutiquesGerees()->where('id', $boutique->id)->exists();
    }

    // Pas de delete() : "Supprimer boutique" (Tableau 6) appartient au Super
    // Admin uniquement, deja hors du perimetre de cette Policy cote Gerant.
}