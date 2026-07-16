<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            // 'vente' : commande client (impacte le stock en baisse).
            // 'livraison' : réception fournisseur (impacte le stock en hausse).
            // Choix retenu pour rester fidèle au mémoire, qui ne décrit pas de table
            // Livraison dédiée dans le diagramme de classe : on réutilise Commande plutôt
            // que d'ajouter une entité absente du diagramme.
            $table->enum('type', ['vente', 'livraison']);
            $table->string('numero')->unique();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users'); // auteur de la commande
            $table->decimal('montant_ht', 12, 2)->default(0);
            $table->decimal('montant_tva', 12, 2)->default(0);
            $table->decimal('montant_ttc', 12, 2)->default(0);
            $table->decimal('montant_paye', 12, 2)->default(0);
            $table->enum('statut', ['en_attente', 'validee', 'annulee'])->default('en_attente');
            $table->enum('statut_paiement', ['non_payee', 'partielle', 'payee'])->default('non_payee');
            $table->timestamp('annulee_at')->nullable();
            $table->timestamps();

            $table->index(['boutique_id', 'type', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commandes');
    }
};