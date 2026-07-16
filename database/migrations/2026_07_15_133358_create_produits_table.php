<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('categorie_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('nom');
            $table->string('reference')->nullable();
            $table->decimal('prix_achat', 12, 2)->default(0);
            $table->decimal('prix_vente', 12, 2);
            $table->decimal('taux_tva', 5, 2)->default(0);
            $table->integer('quantite_stock')->default(0);
            $table->integer('seuil_alerte')->default(0);
            $table->timestamps();

            $table->index(['boutique_id', 'nom']);
        });

        // Contrainte au niveau base pour empêcher un stock négatif, en plus de la
        // vérification applicative faite dans Produit::reduireStock().
        \DB::statement('ALTER TABLE produits ADD CONSTRAINT chk_quantite_stock_positive CHECK (quantite_stock >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};