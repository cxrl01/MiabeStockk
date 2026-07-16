<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->string('libelle');
            $table->decimal('montant', 12, 2);
            $table->string('categorie')->nullable(); // loyer, salaires, transport...
            $table->date('date_depense');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();

            $table->index(['boutique_id', 'date_depense']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};