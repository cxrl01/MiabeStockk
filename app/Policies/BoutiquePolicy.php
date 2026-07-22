<?php

namespace App\Policies;

use App\Models\Boutique;
use App\Models\User;

class BoutiquePolicy
{
    // Consultation ouverte a tout membre de la boutique (Dashboard, etc. en
    // ont besoin pour afficher le nom/devise/tva de leur boutique), et au
    // Super Admin sur n'importe quelle boutique (supervision).
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Boutique $boutique): bool
    {
        return $user->hasRole('super_admin') || $user->appartientABoutique($boutique->id);
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

    // Tableau 6 : "Suspendre / Reactiver / Supprimer boutique" = Super Admin
    // uniquement, sur n'importe quelle boutique de la plateforme.
    public function suspendre(User $user, Boutique $boutique): bool
    {
        return $user->hasRole('super_admin');
    }

    public function reactiver(User $user, Boutique $boutique): bool
    {
        return $user->hasRole('super_admin');
    }

    public function delete(User $user, Boutique $boutique): bool
    {
        return $user->hasRole('super_admin');
    }
}