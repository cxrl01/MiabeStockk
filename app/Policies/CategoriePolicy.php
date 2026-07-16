<?php

namespace App\Policies;

use App\Models\Categorie;
use App\Models\User;

class CategoriePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Categorie $categorie): bool
    {
        return $user->appartientABoutique($categorie->boutique_id);
    }

    public function create(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function update(User $user, Categorie $categorie): bool
    {
        return $user->appartientABoutique($categorie->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function delete(User $user, Categorie $categorie): bool
    {
        return $user->appartientABoutique($categorie->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }
}