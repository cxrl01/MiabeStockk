<?php

namespace Database\Seeders;

use App\Models\Boutique;
use App\Models\Categorie;
use App\Models\Client;
use App\Models\Fournisseur;
use App\Models\Produit;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    /**
     * Jeu de données de démo pour tester le flux complet (auth -> stock ->
     * clients -> vente) sans passer par les formulaires un par un.
     * Mot de passe unique pour tous les comptes : "password".
     *
     * Les roles ne sont PAS crees ici : la migration create_roles_table les
     * insere deja (super_admin, gerant, gestionnaire, commercial). Les
     * recreer ici ferait echouer la contrainte unique sur roles.nom.
     */
    public function run(): void
    {
        $roleGerant = Role::where('nom', 'gerant')->firstOrFail();
        $roleGestionnaire = Role::where('nom', 'gestionnaire')->firstOrFail();
        $roleCommercial = Role::where('nom', 'commercial')->firstOrFail();

        $gerant = User::create([
            'role_id' => $roleGerant->id,
            'nom' => 'Adjovi',
            'prenom' => 'Awa',
            'email' => 'gerant@test.com',
            'telephone' => '+22890000001',
            'password' => Hash::make('password'),
            'actif' => true,
        ]);

        $boutique = Boutique::create([
            'gerant_id' => $gerant->id,
            'nom' => 'Boutique Awa',
            'adresse' => 'Marché de Lomé, Togo',
            'telephone' => '+22890000000',
            'devise' => 'FCFA',
            'tva' => 18, // taux de TVA de la boutique (attribut Boutique, diagramme de classe)
            'statut' => 'active',
        ]);

        User::create([
            'role_id' => $roleGestionnaire->id,
            'boutique_id' => $boutique->id,
            'nom' => 'Mensah',
            'prenom' => 'Kodjo',
            'email' => 'gestionnaire@test.com',
            'telephone' => '+22890000002',
            'password' => Hash::make('password'),
            'poste' => 'Magasinier',
            'actif' => true,
        ]);

        User::create([
            'role_id' => $roleCommercial->id,
            'boutique_id' => $boutique->id,
            'nom' => 'Amegan',
            'prenom' => 'Efua',
            'email' => 'commercial@test.com',
            'telephone' => '+22890000003',
            'password' => Hash::make('password'),
            'poste' => 'Caissière',
            'actif' => true,
        ]);

        $categorieAlimentation = Categorie::create(['boutique_id' => $boutique->id, 'nom' => 'Alimentation']);
        $categorieBoissons = Categorie::create(['boutique_id' => $boutique->id, 'nom' => 'Boissons']);
        $categorieHygiene = Categorie::create(['boutique_id' => $boutique->id, 'nom' => 'Hygiène']);

        // Plus de taux_tva par produit : la TVA vient desormais de $boutique->tva
        // (voir VenteController::store, LigneCommande recoit taux_tva de la boutique).
        $produits = [
            ['categorie_id' => $categorieAlimentation->id, 'nom' => 'Riz 5kg', 'reference' => 'ALI-001', 'prix_achat' => 2800, 'prix_vente' => 3500, 'quantite_stock' => 40, 'seuil_alerte' => 10],
            ['categorie_id' => $categorieAlimentation->id, 'nom' => 'Huile 1L', 'reference' => 'ALI-002', 'prix_achat' => 1000, 'prix_vente' => 1300, 'quantite_stock' => 6, 'seuil_alerte' => 8], // en alerte
            ['categorie_id' => $categorieBoissons->id, 'nom' => 'Eau minérale 1.5L', 'reference' => 'BOI-001', 'prix_achat' => 250, 'prix_vente' => 400, 'quantite_stock' => 100, 'seuil_alerte' => 20],
            ['categorie_id' => $categorieBoissons->id, 'nom' => 'Boisson gazeuse 50cl', 'reference' => 'BOI-002', 'prix_achat' => 350, 'prix_vente' => 500, 'quantite_stock' => 3, 'seuil_alerte' => 15], // en alerte
            ['categorie_id' => $categorieHygiene->id, 'nom' => 'Savon Marseille', 'reference' => 'HYG-001', 'prix_achat' => 700, 'prix_vente' => 1000, 'quantite_stock' => 25, 'seuil_alerte' => 10],
        ];

        foreach ($produits as $donnees) {
            Produit::create(['boutique_id' => $boutique->id, ...$donnees]);
        }

        Client::create(['boutique_id' => $boutique->id, 'nom' => 'Kossi Agbo', 'telephone' => '+22891111111', 'dette' => 0]);
        Client::create(['boutique_id' => $boutique->id, 'nom' => 'Ama Séna', 'telephone' => '+22892222222', 'dette' => 4500]);
        Client::create(['boutique_id' => $boutique->id, 'nom' => 'Yao Koffi', 'telephone' => '+22893333333', 'dette' => 0]);

        Fournisseur::create([
            'boutique_id' => $boutique->id,
            'nom' => 'Grossiste Marché de Lomé',
            'telephone' => '+22894444444',
            'adresse' => 'Grand Marché, Lomé',
            'conditions_paiement' => '30 jours',
            'dette' => 0,
        ]);
        Fournisseur::create([
            'boutique_id' => $boutique->id,
            'nom' => 'Import Boissons Togo',
            'telephone' => '+22895555555',
            'adresse' => 'Zone portuaire, Lomé',
            'conditions_paiement' => 'Comptant',
            'dette' => 15000,
        ]);
    }
}