<?php

namespace Database\Factories;

use App\Models\Boutique;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProduitFactory extends Factory
{
    public function definition(): array
    {
        return [
            'boutique_id' => Boutique::factory(),
            'nom' => $this->faker->words(2, true),
            'reference' => strtoupper($this->faker->bothify('REF-####')),
            'prix_achat' => $this->faker->randomFloat(2, 100, 5000),
            'prix_vente' => $this->faker->randomFloat(2, 500, 8000),
            'taux_tva' => 18,
            'quantite_stock' => $this->faker->numberBetween(10, 100),
            'seuil_alerte' => 5,
        ];
    }
}