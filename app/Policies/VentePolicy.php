<?php

namespace App\Policies;

use App\Models\Commande;
use App\Models\User;

class VentePolicy
{
    /**
     * Tous les rôles peuvent voir la liste, mais le contrôleur filtre déjà
     * la requête sur la boutique de l'utilisateur (voir VenteController::index).
     * Couvre aussi "Consulter l'historique des ventes" pour le Gestionnaire
     * (Tableau 6 du mémoire) — il n'a pas besoin de permission supplémentaire.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Commande $commande): bool
    {
        return $user->appartientABoutique($commande->boutique_id);
    }

    // Tableau 6 du mémoire : "Créer vente" / "Encaisser" appartiennent au
    // Gérant et au Commercial uniquement. Le Gestionnaire n'a que la
    // consultation de l'historique — pas de saisie de vente. Le Super Admin
    // supervise, il ne vend pas.
    public function create(User $user): bool
    {
        return in_array($user->role->nom, ['gerant', 'commercial']);
    }

    // Tableau 6 du mémoire : "Annuler vente" n'apparaît que dans la liste du
    // Gérant. Ni Commercial ni Gestionnaire ne l'ont — action sensible
    // (réintègre le stock) réservée au Gérant seul.
    public function annuler(User $user, Commande $commande): bool
    {
        return $user->appartientABoutique($commande->boutique_id)
            && $user->role->nom === 'gerant';
    }

    // "Encaisser" (Tableau 6) = Gérant + Commercial, comme create().
    public function enregistrerPaiement(User $user, Commande $commande): bool
    {
        return $user->appartientABoutique($commande->boutique_id)
            && in_array($user->role->nom, ['gerant', 'commercial']);
    }

    // Tableau 6 du mémoire : "Générer PDF" appartient au Gérant et au
    // Commercial. Le Gestionnaire a seulement "Consulter l'historique des
    // ventes", pas l'export — distinct de view() qui reste ouvert à toute
    // la boutique pour la simple consultation.
    public function genererPdf(User $user, Commande $commande): bool
    {
        return $user->appartientABoutique($commande->boutique_id)
            && in_array($user->role->nom, ['gerant', 'commercial']);
    }
}