<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Etape 1 : colonne nullable d'abord, impossible d'ajouter directement en
        // NOT NULL sur une table qui contient deja des lignes (paiements de test
        // deja enregistres via le flux de vente).
        Schema::table('paiements', function (Blueprint $table) {
            $table->string('numero_facture')->nullable()->after('commande_id');
        });

        // Etape 2 : backfill des lignes existantes avec un numero unique genere.
        // ->get()->each() (collection), pas ->each() du query builder qui n'existe pas.
        DB::table('paiements')->whereNull('numero_facture')->orderBy('id')->get()->each(function ($paiement) {
            DB::table('paiements')
                ->where('id', $paiement->id)
                ->update([
                    'numero_facture' => sprintf(
                        'FAC-%s-%s',
                        \Carbon\Carbon::parse($paiement->created_at)->format('Ymd'),
                        strtoupper(Str::random(6))
                    ),
                ]);
        });

        // Etape 3 : rendre la colonne obligatoire. En SQL brut plutot que
        // ->nullable(false)->change(), qui necessite le package doctrine/dbal
        // (non installe par defaut).
        DB::statement('ALTER TABLE paiements ALTER COLUMN numero_facture SET NOT NULL');

        // Etape 4 : contrainte d'unicite (ajout d'index, ne necessite pas doctrine/dbal
        // contrairement a une modification de colonne existante).
        Schema::table('paiements', function (Blueprint $table) {
            $table->unique('numero_facture');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropUnique(['numero_facture']);
            $table->dropColumn('numero_facture');
        });
    }
};