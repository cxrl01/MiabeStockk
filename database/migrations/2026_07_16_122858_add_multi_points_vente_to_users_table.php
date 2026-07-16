<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Active le mode multi points de vente / succursales pour un Gérant.
            // Si false, l'UI reste mono-boutique ; le gérant pourra évoluer plus tard.
            $table->boolean('multi_points_vente')->default(false)->after('actif');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('multi_points_vente');
        });
    }
};
