<?php

namespace Tests\Feature;

use App\Models\Boutique;
use App\Models\Client;
use App\Models\Produit;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VenteTest extends TestCase
{
    use RefreshDatabase;

    private function creerCommercial(Boutique $boutique): User
    {
        $role = Role::firstOrCreate(['nom' => 'commercial'], ['libelle' => 'Commercial']);

        return User::factory()->create([
            'role_id' => $role->id,
            'boutique_id' => $boutique->id,
        ]);
    }

    private function creerGerant(Boutique $boutique): User
    {
        $role = Role::firstOrCreate(['nom' => 'gerant'], ['libelle' => 'Gérant']);

        // Un gérant n'est pas rattaché via boutique_id, mais via la colonne
        // gerant_id sur la boutique elle-même (cf. User::boutiquesGerees()).
        $gerant = User::factory()->create([
            'role_id' => $role->id,
            'boutique_id' => null,
        ]);

        $boutique->update(['gerant_id' => $gerant->id]);

        return $gerant;
    }

    public function test_une_vente_calcule_correctement_le_montant_ttc(): void
    {
        $boutique = Boutique::factory()->create();
        $user = $this->creerCommercial($boutique);
        $produit = Produit::factory()->create([
            'boutique_id' => $boutique->id,
            'prix_vente' => 1000,
            'taux_tva' => 18,
            'quantite_stock' => 10,
        ]);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/v1/ventes', [
            'lignes' => [
                ['produit_id' => $produit->id, 'quantite' => 2],
            ],
        ]);

        $reponse->assertCreated();
        // 2 x 1000 = 2000 HT, TVA 18% = 360, TTC = 2360
        $this->assertEquals(2360, $reponse->json('montant_ttc'));
        $this->assertEquals(8, $produit->fresh()->quantite_stock);
    }

    public function test_annuler_une_vente_reintegre_le_stock(): void
    {
        $boutique = Boutique::factory()->create();
        $commercial = $this->creerCommercial($boutique);
        $produit = Produit::factory()->create([
            'boutique_id' => $boutique->id,
            'prix_vente' => 500,
            'taux_tva' => 0,
            'quantite_stock' => 5,
        ]);

        $creation = $this->actingAs($commercial, 'sanctum')->postJson('/api/v1/ventes', [
            'lignes' => [['produit_id' => $produit->id, 'quantite' => 3]],
        ]);

        $venteId = $creation->json('id');
        $this->assertEquals(2, $produit->fresh()->quantite_stock);

        // L'annulation est une action sensible réservée au gérant/gestionnaire
        $gerant = $this->creerGerant($boutique);

        $annulation = $this->actingAs($gerant, 'sanctum')->postJson("/api/v1/ventes/{$venteId}/annuler");

        $annulation->assertOk();
        $this->assertEquals(5, $produit->fresh()->quantite_stock);
        $this->assertEquals('annulee', $annulation->json('statut'));
    }

    public function test_un_commercial_ne_peut_pas_annuler_une_vente(): void
    {
        $boutique = Boutique::factory()->create();
        $commercial = $this->creerCommercial($boutique);
        $produit = Produit::factory()->create([
            'boutique_id' => $boutique->id,
            'quantite_stock' => 5,
        ]);

        $creation = $this->actingAs($commercial, 'sanctum')->postJson('/api/v1/ventes', [
            'lignes' => [['produit_id' => $produit->id, 'quantite' => 3]],
        ]);

        $venteId = $creation->json('id');

        $annulation = $this->actingAs($commercial, 'sanctum')->postJson("/api/v1/ventes/{$venteId}/annuler");

        $annulation->assertForbidden();
        $this->assertEquals(2, $produit->fresh()->quantite_stock);
    }

    public function test_impossible_de_vendre_plus_que_le_stock_disponible(): void
    {
        $boutique = Boutique::factory()->create();
        $user = $this->creerCommercial($boutique);
        $produit = Produit::factory()->create([
            'boutique_id' => $boutique->id,
            'quantite_stock' => 1,
        ]);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/v1/ventes', [
            'lignes' => [['produit_id' => $produit->id, 'quantite' => 5]],
        ]);

        $reponse->assertStatus(422)->assertSeeText('Stock insuffisant');
    }
}