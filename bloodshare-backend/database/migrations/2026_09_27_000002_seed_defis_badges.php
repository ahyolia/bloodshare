<?php

use App\Models\Badge;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 📖 Comme pour les badges cartes/quiz (2026_09_26_000000_seed_cartes_et_quiz_badges) :
        //    entrypoint.sh ne lance les seeders que si RUN_SEEDERS=true, jamais sur Dokploy.
        $badges = [
            [
                'nom' => "Esprit d'équipe",
                'action_specifique' => 'defi_contribue',
            ],
            [
                'nom' => 'Objectif atteint',
                'action_specifique' => 'defi_remporte',
            ],
        ];

        foreach ($badges as $badge) {
            Badge::updateOrCreate(
                ['nom' => $badge['nom']],
                [
                    'condition_type' => 'action_specifique',
                    'condition_valeur' => null,
                    'action_specifique' => $badge['action_specifique'],
                    'image_url' => null,
                    'statut' => 'actif',
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Badge::whereIn('nom', ["Esprit d'équipe", 'Objectif atteint'])->delete();
    }
};
