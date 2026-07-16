<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BoutiqueFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom' => $this->faker->company(),
            'adresse' => $this->faker->address(),
            'telephone' => $this->faker->phoneNumber(),
            'statut' => 'active',
        ];
    }
}