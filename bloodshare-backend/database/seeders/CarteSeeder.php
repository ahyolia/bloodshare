<?php

namespace Database\Seeders;

use App\Models\Carte;
use Illuminate\Database\Seeder;

class CarteSeeder extends Seeder
{
    public function run(): void
    {
        // Une collection de cartes de mois par année, de la première à l'année en cours.
        foreach (range(Carte::PREMIERE_COLLECTION, max(Carte::PREMIERE_COLLECTION, now()->year)) as $annee) {
            Carte::collectionMois($annee);
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
            [
                'categorie' => 'fidele',
                'titre' => 'Carte Fidèle',
                'description' => 'Carte obtenue après un an de dons',
            ],
        ];

        foreach ($cartesSpeciales as $carte) {
            // 📖 Plusieurs cartes Événement peuvent exister (forum IUT...) : on ne retrouve
            //    que la générique, sinon la carte d'un événement serait renommée ici.
            $cle = ['categorie' => $carte['categorie'], 'mois_numero' => null];
            if ($carte['categorie'] === 'evenement') {
                $cle['generique'] = true;
            }

            Carte::updateOrCreate(
                $cle,
                [
                    'titre' => $carte['titre'],
                    'description' => $carte['description'],
                    'statut' => 'active',
                ]
            );
        }
    }
}
