<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Client $client): bool
    {
        return $user->appartientABoutique($client->boutique_id);
    }

    // Le personnel au contact des clients (Gérant, Gestionnaire, Commercial)
    // peut créer une fiche client — utile en plein flux de vente.
    public function create(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'gestionnaire', 'commercial']);
    }

    // Modifier/supprimer une fiche (dette, coordonnées) reste plus sensible,
    // réservé à Gérant/Gestionnaire.
    public function update(User $user, Client $client): bool
    {
        return $user->appartientABoutique($client->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->appartientABoutique($client->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }
}