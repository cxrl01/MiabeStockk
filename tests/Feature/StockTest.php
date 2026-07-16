<?php

namespace Tests\Feature;

use App\Models\Boutique;
use App\Models\Categorie;
use App\Models\Produit;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockTest extends TestCase
{
    use RefreshDatabase;

    private function creerUtilisateur(Boutique $boutique, string $roleNom = 'gestionnaire'): User
    {
        $role = Role::firstOrCreate(['nom' => $roleNom], ['libelle' => ucfirst($roleNom)]);

        return User::factory()->create([
            'role_id' => $role->id,
            'boutique_id' => $boutique->id,
        ]);
    }

    public function test_un_gestionnaire_peut_creer_une_categorie(): void
    {
        $boutique = Boutique::factory()->create();
        $gestionnaire = $this->creerUtilisateur($boutique, 'gestionnaire');

        $reponse = $this->actingAs($gestionnaire, 'sanctum')->postJson('/api/v1/categories', [
            'nom' => 'Boissons',
        ]);

        $reponse->assertCreated();
        $this->assertDatabaseHas('categories', ['nom' => 'Boissons', 'boutique_id' => $boutique->id]);
    }

    public function test_un_commercial_ne_peut_pas_creer_une_categorie(): void
    {
        $boutique = Boutique::factory()->create();
        $commercial = $this->creerUtilisateur($boutique, 'commercial');

        $reponse = $this->actingAs($commercial, 'sanctum')->postJson('/api/v1/categories', [
            'nom' => 'Boissons',
        ]);

        $reponse->assertForbidden();
    }

    public function test_deux_boutiques_peuvent_avoir_chacune_une_categorie_de_meme_nom(): void
    {
        $boutiqueA = Boutique::factory()->create();
        $boutiqueB = Boutique::factory()->create();
        $gestionnaireA = $this->creerUtilisateur($boutiqueA, 'gestionnaire');
        $gestionnaireB = $this->creerUtilisateur($boutiqueB, 'gestionnaire');

        $this->actingAs($gestionnaireA, 'sanctum')
            ->postJson('/api/v1/categories', ['nom' => 'Boissons'])
            ->assertCreated();

        $this->actingAs($gestionnaireB, 'sanctum')
            ->postJson('/api/v1/categories', ['nom' => 'Boissons'])
            ->assertCreated();
    }

    public function test_creer_un_produit_avec_prix_vente_inferieur_au_prix_achat_echoue(): void
    {
        $boutique = Boutique::factory()->create();
        $gestionnaire = $this->creerUtilisateur($boutique, 'gestionnaire');

        $reponse = $this->actingAs($gestionnaire, 'sanctum')->postJson('/api/v1/produits', [
            'nom' => 'Savon',
            'prix_achat' => 1000,
            'prix_vente' => 500,
        ]);

        $reponse->assertStatus(422)->assertJsonValidationErrors('prix_vente');
    }

    public function test_liste_des_produits_en_alerte_de_seuil(): void
    {
        $boutique = Boutique::factory()->create();
        $gestionnaire = $this->creerUtilisateur($boutique, 'gestionnaire');

        $produitBas = Produit::factory()->create([
            'boutique_id' => $boutique->id,
            'quantite_stock' => 2,
            'seuil_alerte' => 5,
        ]);
        Produit::factory()->create([
            'boutique_id' => $boutique->id,
            'quantite_stock' => 50,
            'seuil_alerte' => 5,
        ]);

        $reponse = $this->actingAs($gestionnaire, 'sanctum')->getJson('/api/v1/produits/alertes');

        $reponse->assertOk();
        $ids = collect($reponse->json())->pluck('id');
        $this->assertTrue($ids->contains($produitBas->id));
        $this->assertCount(1, $ids);
    }

    public function test_ajustement_manuel_du_stock_est_trace(): void
    {
        $boutique = Boutique::factory()->create();
        $gestionnaire = $this->creerUtilisateur($boutique, 'gestionnaire');
        $produit = Produit::factory()->create([
            'boutique_id' => $boutique->id,
            'quantite_stock' => 10,
        ]);

        $reponse = $this->actingAs($gestionnaire, 'sanctum')->postJson("/api/v1/produits/{$produit->id}/ajuster-stock", [
            'type' => 'sortie',
            'quantite' => 3,
            'motif' => 'casse',
        ]);

        $reponse->assertCreated();
        $this->assertEquals(7, $produit->fresh()->quantite_stock);
        $this->assertDatabaseHas('mouvements_stock', [
            'produit_id' => $produit->id,
            'type' => 'sortie',
            'quantite' => 3,
            'motif' => 'ajustement: casse',
        ]);
    }

    public function test_un_commercial_ne_peut_pas_ajuster_le_stock(): void
    {
        $boutique = Boutique::factory()->create();
        $commercial = $this->creerUtilisateur($boutique, 'commercial');
        $produit = Produit::factory()->create(['boutique_id' => $boutique->id, 'quantite_stock' => 10]);

        $reponse = $this->actingAs($commercial, 'sanctum')->postJson("/api/v1/produits/{$produit->id}/ajuster-stock", [
            'type' => 'sortie',
            'quantite' => 3,
            'motif' => 'casse',
        ]);

        $reponse->assertForbidden();
        $this->assertEquals(10, $produit->fresh()->quantite_stock);
    }

    public function test_impossible_de_supprimer_une_categorie_non_vide(): void
    {
        $boutique = Boutique::factory()->create();
        $gestionnaire = $this->creerUtilisateur($boutique, 'gestionnaire');
        $categorie = Categorie::factory()->create(['boutique_id' => $boutique->id]);
        Produit::factory()->create(['boutique_id' => $boutique->id, 'categorie_id' => $categorie->id]);

        $reponse = $this->actingAs($gestionnaire, 'sanctum')->deleteJson("/api/v1/categories/{$categorie->id}");

        $reponse->assertStatus(422);
        $this->assertDatabaseHas('categories', ['id' => $categorie->id]);
    }
}