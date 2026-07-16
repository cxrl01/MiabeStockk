<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            // super_admin, gerant, gestionnaire, commercial
            $table->string('nom')->unique();
            $table->string('libelle');
            $table->timestamps();
        });

        // Seed des 4 rôles système définis dans le cahier des charges (RBAC)
        \DB::table('roles')->insert([
            ['nom' => 'super_admin', 'libelle' => 'Super Admin', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'gerant', 'libelle' => 'Gérant', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'gestionnaire', 'libelle' => 'Gestionnaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'commercial', 'libelle' => 'Commercial', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};