<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boutiques', function (Blueprint $table) {
            // Un Gérant peut posséder plusieurs boutiques (1,n) — cf. écart signalé
            // entre le diagramme de classe (0..1) et le texte du mémoire.
            $table->foreign('gerant_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('boutiques', function (Blueprint $table) {
            $table->dropForeign(['gerant_id']);
        });
    }
};