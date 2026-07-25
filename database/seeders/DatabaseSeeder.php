<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Crée ou récupère le rôle super_admin
        $role = Role::firstOrCreate(
            ['nom' => 'super_admin'],
            ['libelle' => 'Super Admin']
        );

        // 2. Crée ou met à jour le SuperAdmin
        User::updateOrCreate(
            ['email' => 'superadmin@miabestock.com'],
            [
                'role_id'   => $role->id,
                'nom'       => 'Admin',
                'prenom'    => 'Super',
                'telephone' => null,
                'password'  => 'PasswordAdmin', // Laravel applique automatiquement le cast 'hashed'
                'actif'     => true,
            ]
        );
    }
}