<?php

namespace App\Policies;

use App\Models\Depense;
use App\Models\User;

class DepensePolicy
{
    // Tableau 6 du memoire : "Enregistrer depense, Consulter tresorerie" =
    // Gerant + Gestionnaire uniquement.
    public function viewAny(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function view(User $user, Depense $depense): bool
    {
        return $user->appartientABoutique($depense->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function update(User $user, Depense $depense): bool
    {
        return $user->appartientABoutique($depense->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function delete(User $user, Depense $depense): bool
    {
        return $user->appartientABoutique($depense->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }
}