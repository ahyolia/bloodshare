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
                'nom' => 'Collection en cours',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'six_cartes_mois',
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
            [
                'nom' => 'Défi du mois',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'premier_defi_contribue',
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
    }
}
