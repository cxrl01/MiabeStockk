<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('boutique_id')->nullable()->constrained('boutiques')->nullOnDelete();
            $table->string('action'); // ex: 'vente.annulee', 'utilisateur.suspendu'
            $table->string('sujet_type')->nullable(); // classe du modèle concerné
            $table->unsignedBigInteger('sujet_id')->nullable();
            $table->json('donnees')->nullable(); // contexte additionnel (avant/après)
            $table->string('ip_adresse')->nullable();
            $table->timestamps();

            $table->index(['sujet_type', 'sujet_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};