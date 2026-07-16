<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->string('nom');
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            // Dette cumulée du client, recalculée à chaque commande/paiement.
            $table->decimal('dette', 12, 2)->default(0);
            $table->timestamps();

            $table->index('boutique_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};