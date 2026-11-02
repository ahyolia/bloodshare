<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// 📖 Un défi ne rapporte plus de points depuis l'US-27 (PR #102) : y participer, c'est
//    donner, et un don ne rapporte jamais de points (règle éthique ADSB-NC). Mais les
//    points « defi » distribués avant ce correctif étaient restés dans l'historique et
//    dans le total des utilisateurs. On les retire, puis la base refuse cette source.
//
// 📖 On soustrait les points « defi » du total plutôt que de recalculer le total depuis
//    l'historique : on ne retire ainsi que ce qui vient des défis, sans dépendre du fait
//    que l'historique ait toujours été complet. GREATEST(…, 0) : jamais de total négatif.
// 📖 Requêtes SQL directes, sans passer par le modèle User : aucune notification de
//    « changement de niveau » n'est envoyée pour cette correction.
return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            DB::statement("
                UPDATE users
                SET points_cumules = GREATEST(users.points_cumules - defis.total, 0)
                FROM (
                    SELECT user_id, SUM(points) AS total
                    FROM points_historique
                    WHERE source = 'defi'
                    GROUP BY user_id
                ) AS defis
                WHERE users.id = defis.user_id
            ");

            DB::table('points_historique')->where('source', 'defi')->delete();

            DB::statement('ALTER TABLE points_historique DROP CONSTRAINT points_historique_source_check');
            DB::statement("ALTER TABLE points_historique
                ADD CONSTRAINT points_historique_source_check
                CHECK (source IN ('quiz', 'parrainage'))");
        });
    }

    // Rétablit seulement la contrainte : les points retirés ne reviennent pas.
    public function down(): void
    {
        DB::statement('ALTER TABLE points_historique DROP CONSTRAINT points_historique_source_check');
        DB::statement("ALTER TABLE points_historique
            ADD CONSTRAINT points_historique_source_check
            CHECK (source IN ('quiz', 'defi', 'parrainage'))");
    }
};
