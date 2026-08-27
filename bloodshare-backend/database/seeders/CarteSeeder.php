<?php

namespace Database\Seeders;

use App\Models\Carte;
use Illuminate\Database\Seeder;

class CarteSeeder extends Seeder
{
    public function run(): void
    {
        $mois = [
            1 => 'Janvier',
            2 => 'Février',
            3 => 'Mars',
            4 => 'Avril',
            5 => 'Mai',
            6 => 'Juin',
            7 => 'Juillet',
            8 => 'Août',
            9 => 'Septembre',
            10 => 'Octobre',
            11 => 'Novembre',
            12 => 'Décembre',
        ];

        foreach ($mois as $numero => $nom) {
            Carte::updateOrCreate(
                ['categorie' => 'mois_don', 'mois_numero' => $numero],
                [
                    'titre' => "Carte de {$nom}",
                    'description' => "Carte obtenue lors d'un don en {$nom}",
                    'image_url' => null,
                    'statut' => 'active',
                ]
            );
        }

        $cartesSpeciales = [
            [
                'categorie' => 'evenement',
                'titre' => 'Carte Événement',
                'description' => 'Carte obtenue lors d\'un événement ADSB-NC',
            ],
            [
                'categorie' => 'parrain',
                'titre' => 'Carte Parrain',
                'description' => 'Carte obtenue en parrainant un donneur',
            ],
            [
                'categorie' => 'filleul',
                'titre' => 'Carte Filleul',
                'description' => 'Carte obtenue en étant parrainé',
            ],
        ];

        foreach ($cartesSpeciales as $carte) {
            Carte::updateOrCreate(
                ['categorie' => $carte['categorie'], 'mois_numero' => null],
                [
                    'titre' => $carte['titre'],
                    'description' => $carte['description'],
                    'image_url' => null,
                    'statut' => 'active',
                ]
            );
        }
    }
}
