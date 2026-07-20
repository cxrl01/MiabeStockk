<?php

namespace App\Policies;

use App\Models\User;

class EquipePolicy
{
    /**
     * Tableau 6 du memoire : "Ajouter/Modifier/Supprimer compte employe"
     * n'apparait QUE dans la liste du Gerant. Ni Gestionnaire ni Commercial
     * n'ont de droit de gestion des comptes — meme pas de leurs collegues.
     * Contrairement a Produit/Fournisseur, on ne laisse pas viewAny() ouvert
     * largement : gerer une equipe (emails, telephones) est plus sensible
     * qu'un catalogue produits.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->nom === 'gerant';
    }

    public function view(User $user, User $employe): bool
    {
        return $user->role->nom === 'gerant'
            && $user->appartientABoutique($employe->boutique_id);
    }

    public function create(User $user): bool
    {
        return $user->role->nom === 'gerant';
    }

    public function update(User $user, User $employe): bool
    {
        return $user->role->nom === 'gerant'
            && $user->appartientABoutique($employe->boutique_id);
    }

    public function delete(User $user, User $employe): bool
    {
        return $user->role->nom === 'gerant'
            && $user->appartientABoutique($employe->boutique_id)
            && $user->id !== $employe->id; // un gerant ne peut pas se supprimer lui-meme
    }
}