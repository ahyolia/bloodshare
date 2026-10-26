<?php

use Database\Seeders\FichesPratiquesSeeder;
use Database\Seeders\QuestionEligibiliteSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    // 📖 Migration et non simple seeder : entrypoint.sh ne lance les seeders que si
    //    RUN_SEEDERS=true, jamais sur Dokploy ni sae203. Sans elle, la page Don garderait
    //    les anciennes fiches et l'éligibilité les anciens textes après la mise en ligne.
    //    Les deux seeders sont idempotents ; FichesPratiquesSeeder ne réécrit pas une fiche
    //    déjà modifiée dans le backoffice.
    // 📖 Rien pendant les tests : RefreshDatabase rejoue les migrations, les fiches et
    //    questions seraient dans chaque base de test. SeedFichesEtEligibiliteTest lance up().
    public function up(bool $memeEnTest = false): void
    {
        if (app()->runningUnitTests() && ! $memeEnTest) {
            return;
        }

        (new FichesPratiquesSeeder)->run();
        (new QuestionEligibiliteSeeder)->run();
    }

    // Rien à défaire : supprimer les fiches effacerait aussi les retouches faites dans le BO.
    public function down(): void
    {
    }
};
