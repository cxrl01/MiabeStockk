<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->string('nom');
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->string('conditions_paiement')->nullable();
            // Dette de la boutique envers ce fournisseur.
            $table->decimal('dette', 12, 2)->default(0);
            $table->timestamps();

            $table->index('boutique_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};