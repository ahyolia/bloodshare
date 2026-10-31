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
        // 📖 BadgeService::synchroniser() liste les badges déjà obtenus avant d'insérer les
        //    nouveaux, mais rien n'empêchait deux requêtes concurrentes (ex. GET /badges et un
        //    scan au même moment) de passer cette lecture toutes les deux puis d'insérer en
        //    double — d'autant plus que synchroniser() tourne désormais à chaque lecture. La
        //    contrainte fait respecter la règle au niveau base, la seule garantie fiable contre
        //    une vraie concurrence (revue par @nevizsh).
        Schema::table('user_badges', function (Blueprint $table) {
            $table->unique(['user_id', 'badge_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_badges', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'badge_id']);
        });
    }
};
