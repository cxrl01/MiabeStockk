<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produit_id')->constrained('produits');
            // Nullable : un mouvement peut aussi venir d'un ajustement manuel, pas
            // toujours lié à une commande.
            $table->foreignId('commande_id')->nullable()->constrained('commandes')->nullOnDelete();
            $table->enum('type', ['entree', 'sortie']);
            $table->integer('quantite');
            $table->integer('quantite_avant');
            $table->integer('quantite_apres');
            $table->string('motif')->nullable(); // vente, livraison, annulation, ajustement...
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();

            $table->index(['produit_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_stock');
    }
};