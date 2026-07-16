<?php

namespace App\Policies;

use App\Models\Produit;
use App\Models\User;

class ProduitPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Produit $produit): bool
    {
        return $user->appartientABoutique($produit->boutique_id);
    }

    public function create(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function update(User $user, Produit $produit): bool
    {
        return $user->appartientABoutique($produit->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function delete(User $user, Produit $produit): bool
    {
        return $user->appartientABoutique($produit->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function ajusterStock(User $user, Produit $produit): bool
    {
        return $user->appartientABoutique($produit->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }
}