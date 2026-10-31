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
        // 📖 Comme pour la suppression de badges (2026_09_25_000000_delete_unused_badges) :
        //    entrypoint.sh ne lance les seeders que si RUN_SEEDERS=true, jamais sur Dokploy.
        //    BadgeSeeder seul n'aurait donc jamais créé ces 4 lignes en production.
        $badges = [
            [
                'nom' => 'Incollable',
                'condition_type' => 'action_specifique',
                'action_specifique' => 'toutes_categories_quiz',
            ],
            [
                'nom' => 'Belle collection',
                'condition_type' => 'action_specifique',
                'action_specifique' => 'six_cartes_mois',
            ],
            [
                'nom' => 'Année complète',
                'condition_type' => 'action_specifique',
                'action_specifique' => 'douze_cartes_mois',
            ],
            [
                'nom' => 'Toujours partant',
                'condition_type' => 'action_specifique',
                'action_specifique' => 'trois_cartes_evenement',
            ],
        ];

        foreach ($badges as $badge) {
            Badge::updateOrCreate(
                ['nom' => $badge['nom']],
                [
                    'condition_type' => $badge['condition_type'],
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
        Badge::whereIn('nom', ['Incollable', 'Belle collection', 'Année complète', 'Toujours partant'])
            ->delete();
    }
};
