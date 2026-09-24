<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            [
                'nom' => 'Premier Pas',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'premier_don',
            ],
            [
                'nom' => 'Donneur Confirmé',
                'condition_type' => 'nb_dons',
                'condition_valeur' => 3,
                'action_specifique' => null,
            ],
            [
                'nom' => 'Fidèle au Don',
                'condition_type' => 'nb_dons',
                'condition_valeur' => 5,
                'action_specifique' => null,
            ],
            [
                'nom' => 'Compagnon de route',
                'condition_type' => 'nb_dons',
                'condition_valeur' => 10,
                'action_specifique' => null,
            ],
            [
                'nom' => 'Grain de curiosité',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'premier_quiz',
            ],
            [
                'nom' => 'Bien entouré',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'trois_parrainages',
            ],
            [
                'nom' => 'Bien accueilli',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'inscrit_avec_code',
            ],
            [
                'nom' => 'Ambassadeur',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'premier_parrainage',
            ],
            [
                'nom' => 'Quiz Master',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'cinq_quiz',
            ],
        ];

        foreach ($badges as $badge) {
            Badge::updateOrCreate(
                ['nom' => $badge['nom']],
                [
                    'condition_type' => $badge['condition_type'],
                    'condition_valeur' => $badge['condition_valeur'],
                    'action_specifique' => $badge['action_specifique'],
                    'image_url' => null,
                    'statut' => 'actif',
                ]
            );
        }

        // 📖 « Collection en cours » (six_cartes_mois) et « Défi du mois »
        //    (premier_defi_contribue) avaient été seedés mais ne sont vérifiés nulle part
        //    dans le code : jamais attribuables. Retirés du catalogue produit (revue
        //    @nevizsh) — supprimés explicitement pour les bases où ils existaient déjà.
        Badge::whereIn('nom', ['Collection en cours', 'Défi du mois'])->delete();
    }
}
