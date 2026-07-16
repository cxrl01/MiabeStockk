<?php

namespace Database\Factories;

use App\Models\Boutique;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategorieFactory extends Factory
{
    public function definition(): array
    {
        return [
            'boutique_id' => Boutique::factory(),
            'nom' => $this->faker->unique()->word(),
        ];
    }
}