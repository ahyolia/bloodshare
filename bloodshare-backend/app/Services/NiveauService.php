<?php

namespace App\Services;

class NiveauService
{
    // Paliers définis avec label et seuil min
    private static array $paliers = [
        1 => ['label' => 'Curieux',    'min' => 0,    'max' => 99],
        2 => ['label' => 'Informé',    'min' => 100,  'max' => 299],
        3 => ['label' => 'Engagé',     'min' => 300,  'max' => 599],
        4 => ['label' => 'Ambassadeur','min' => 600,  'max' => 999],
        5 => ['label' => 'Héros',      'min' => 1000, 'max' => null],
    ];

    public static function calculerNiveau(int $points): array
    {
        $niveauActuel = 1;
        $palierActuel = self::$paliers[1];

        foreach (self::$paliers as $niveau => $palier) {
            if ($points >= $palier['min']) {
                $niveauActuel = $niveau;
                $palierActuel = $palier;
            }
        }

        // Niveau maximum atteint
        if ($palierActuel['max'] === null) {
            return [
                'niveau'                 => $niveauActuel,
                'label'                  => $palierActuel['label'],
                'points_actuels'         => $points,
                'points_prochain_niveau' => null,
                'progression'            => 100,
            ];
        }

        // Calcul progression vers le niveau suivant
        $palierSuivant = self::$paliers[$niveauActuel + 1];
        $pointsDansNiveau = $points - $palierActuel['min'];
        $totalPourMontee  = $palierSuivant['min'] - $palierActuel['min'];
        $progression = (int) round(($pointsDansNiveau / $totalPourMontee) * 100);

        return [
            'niveau'                 => $niveauActuel,
            'label'                  => $palierActuel['label'],
            'points_actuels'         => $points,
            'points_prochain_niveau' => $palierSuivant['min'],
            'progression'            => $progression,
        ];
    }
}
