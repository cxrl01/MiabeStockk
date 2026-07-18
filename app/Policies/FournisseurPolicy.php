<?php

namespace App\Policies;

use App\Models\Fournisseur;
use App\Models\User;

class FournisseurPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Fournisseur $fournisseur): bool
    {
        return $user->appartientABoutique($fournisseur->boutique_id);
    }

    // Tableau 6 du mémoire : "Créer fournisseur, Enregistrer livraison, Gérer dette
    // fournisseur" = Gérant + Gestionnaire uniquement. Ni Super Admin ni Commercial.
    public function create(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function update(User $user, Fournisseur $fournisseur): bool
    {
        return $user->appartientABoutique($fournisseur->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function delete(User $user, Fournisseur $fournisseur): bool
    {
        return $user->appartientABoutique($fournisseur->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }
}