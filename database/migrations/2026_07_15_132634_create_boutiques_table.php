<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boutiques', function (Blueprint $table) {
            $table->id();
            // gerant_id ajouté dans une migration suivante (dépendance croisée avec users)
            $table->unsignedBigInteger('gerant_id')->nullable();
            $table->string('nom');
            $table->string('adresse')->nullable();
            $table->string('telephone')->nullable();
            $table->enum('statut', ['active', 'suspendue'])->default('active');
            $table->timestamps();

            $table->index('gerant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boutiques');
    }
};