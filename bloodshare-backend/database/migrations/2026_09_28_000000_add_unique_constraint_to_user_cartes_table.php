<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 📖 Même raison que sur user_badges et user_defis : user_cartes n'avait aucune
        //    contrainte d'unicité sur (user_id, carte_id), seulement sa clé primaire. Un
        //    doublon gonflerait artificiellement le compte de cartes distinctes utilisé par
        //    BadgeService (Belle collection, Année complète) — revue @nevizsh.
        Schema::table('user_cartes', function (Blueprint $table) {
            $table->unique(['user_id', 'carte_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_cartes', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'carte_id']);
        });
    }
};
