<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Le profil de donneur n'alimentait aucun calcul (points, niveau, badges, quiz,
// parrainage) : il ne servait qu'à l'affichage. Comme il révèle qu'une personne
// donne son sang (donnée de santé pour l'ADSB-NC), on cesse de le collecter
// (minimisation, art. 5 du RGPD). Les valeurs existantes sont supprimées.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('statut_donneur');
        });
    }

    // Recrée la colonne vide : les valeurs supprimées ne reviennent pas.
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('statut_donneur', [
                'donneur_regulier',
                'quelques_dons',
                'jamais_donne',
            ])->nullable()->after('sexe');
        });
    }
};
