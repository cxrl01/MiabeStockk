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
            // Pas de taux_tva ici : le diagramme de classe (Figure 23) ne donne pas de TVA a
            // Produit, seulement a Boutique. La TVA appliquee a une vente vient de
            // boutiques.tva, pas d'un taux par produit.
            $table->integer('quantite_stock')->default(0);
            $table->integer('seuil_alerte')->default(0);
            $table->timestamps();

            $table->index(['boutique_id', 'nom']);
        });

        // Contrainte au niveau base pour empecher un stock negatif, en plus de la
        // verification applicative faite dans Produit::reduireStock().
        \DB::statement('ALTER TABLE produits ADD CONSTRAINT chk_quantite_stock_positive CHECK (quantite_stock >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};