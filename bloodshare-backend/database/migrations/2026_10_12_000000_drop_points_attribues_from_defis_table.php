<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 📖 Un défi ne distribue plus de points : ses contributeurs sont des donneurs, et un don ne
//    rapporte jamais de points (règle éthique ADSB-NC, CONTRIBUTING.md). La colonne n'était
//    plus lue nulle part (DefiService, API, BO) : on la retire pour qu'aucun admin ne puisse
//    croire la renseigner utilement. Les points déjà distribués restent dans
//    points_historique (source « defi »), indépendants de cette colonne.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('defis', function (Blueprint $table) {
            $table->dropColumn('points_attribues');
        });
    }

    public function down(): void
    {
        Schema::table('defis', function (Blueprint $table) {
            $table->integer('points_attribues')->default(0)->after('objectif_chiffre');
        });
    }
};
