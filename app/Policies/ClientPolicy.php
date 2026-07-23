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

    // Modifier les coordonnées/infos d'une fiche : ouvert au Commercial aussi
    // (il est souvent le premier à corriger un numéro ou une adresse erronés
    // lors d'une vente). La dette elle-même n'est jamais modifiée ici — elle
    // est gérée automatiquement via les ventes/paiements (voir Commande et
    // Paiement), donc ouvrir update() au Commercial ne lui donne pas la main
    // sur la dette directement.
    public function update(User $user, Client $client): bool
    {
        return $user->appartientABoutique($client->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire', 'commercial']);
    }

    // Supprimer une fiche reste plus sensible (perte définitive de
    // l'historique client) : reste réservé à Gérant/Gestionnaire.
    public function delete(User $user, Client $client): bool
    {
        return $user->appartientABoutique($client->boutique_id)
            && in_array($user->role->nom, ['gerant', 'gestionnaire']);
    }
}