<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained('commandes')->cascadeOnDelete();
            $table->decimal('montant', 12, 2);
            $table->enum('mode', ['especes', 'mobile_money', 'virement', 'cheque'])->default('especes');
            $table->string('reference')->nullable();
            $table->foreignId('user_id')->constrained('users'); // encaissé par
            $table->timestamps();

            $table->index('commande_id');
        });

        \DB::statement('ALTER TABLE paiements ADD CONSTRAINT chk_montant_paiement_positive CHECK (montant > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};