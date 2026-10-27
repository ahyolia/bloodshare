<?php

namespace App\Console\Commands;

use App\Models\Carte;
use Illuminate\Console\Command;

class CreerCollectionCartes extends Command
{
    protected $signature = 'cartes:creer-collection {annee? : Année de la collection (par défaut : l\'année prochaine)}';

    protected $description = 'Crée les 12 cartes de mois d\'une année (sans visuel), pour y poser les dessins depuis le BO';

    public function handle(): int
    {
        $annee = (int) ($this->argument('annee') ?? now()->addYear()->year);

        if ($annee < Carte::PREMIERE_COLLECTION) {
            $this->error('La première collection est celle de ' . Carte::PREMIERE_COLLECTION . '.');

            return self::FAILURE;
        }

        Carte::collectionMois($annee);
        $this->info("Collection {$annee} prête : 12 cartes de mois.");

        return self::SUCCESS;
    }
}
