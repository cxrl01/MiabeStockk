<?php

namespace App\Policies;

use App\Models\Commande;
use App\Models\User;

class VentePolicy
{
    /**
     * Tous les rôles peuvent voir la liste, mais le contrôleur filtre déjà
     * la requête sur la boutique de l'utilisateur (voir VenteController::index).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Commande $commande): bool
    {
        return $user->appartientABoutique($commande->boutique_id);
    }

    // Gestionnaire et Commercial peuvent créer des ventes ; Super Admin
    // supervise mais ne saisit pas de ventes lui-même.
    public function create(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'gestionnaire', 'commercial']);
    }

    // Annulation réservée au Gérant et au Gestionnaire (action sensible,
    // impacte le stock et la trésorerie) — le Commercial ne peut pas annuler.
    public function annuler(User $user, Commande $commande): bool
    {
        return $user->appartientABoutique($commande->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function enregistrerPaiement(User $user, Commande $commande): bool
    {
        return $user->appartientABoutique($commande->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire', 'commercial']);
    }
}