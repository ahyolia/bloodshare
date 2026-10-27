<?php

namespace Tests\Feature;

use App\Models\Contenu;
use App\Models\QuestionEligibilite;
use Database\Seeders\FichesPratiquesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SeedFichesEtEligibiliteTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_migration_installe_les_fiches_et_les_questions_d_eligibilite(): void
    {
        Notification::fake();

        $this->assertSame(0, Contenu::where('type', 'fiche_info')->count());

        $migration = require database_path('migrations/2026_10_27_000000_seed_fiches_pratiques_et_eligibilite.php');
        $migration->up(memeEnTest: true);

        $this->assertSame(count(FichesPratiquesSeeder::fiches()), Contenu::where('type', 'fiche_info')->where('statut', 'publie')->count());
        // Les 15 critères de la liste officielle (QuestionEligibiliteSeeder).
        $this->assertSame(15, QuestionEligibilite::where('actif', true)->count());
    }
}
