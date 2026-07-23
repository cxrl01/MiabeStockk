<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

trait ResolveBoutiqueActive
{
    /**
     * Determine la boutique sur laquelle filtrer/creer pour l'utilisateur
     * courant :
     * - super_admin : null (aucune restriction par defaut) — les controleurs
     *   qui l'utilisent gerent deja leur propre cas super_admin separement.
     * - gerant : la boutique choisie via le header X-Boutique-Id (selecteur
     *   multi-points-de-vente cote frontend), uniquement si elle lui
     *   appartient reellement — sinon repli sur sa premiere boutique geree.
     * - staff (gestionnaire/commercial) : toujours sa boutique unique, le
     *   header est ignore (un staff n'a qu'une seule boutique, pas de choix).
     */
    protected function boutiqueActive(): ?int
    {
        $user = Auth::user();

        if ($user->hasRole('super_admin')) {
            return null;
        }

        if ($user->hasRole('gerant')) {
            $header = request()->header('X-Boutique-Id');

            if ($header && $user->appartientABoutique((int) $header)) {
                return (int) $header;
            }

            return $user->boutiquesGerees()->value('id');
        }

        return $user->boutique_id;
    }
}