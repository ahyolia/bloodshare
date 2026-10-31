<?php

namespace Tests\Feature;

use App\Models\Contenu;
use Database\Seeders\ActualitesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActualitesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_publie_les_actualites_visibles_dans_l_app(): void
    {
        $this->seed(ActualitesSeeder::class);

        $titre = ActualitesSeeder::actualites()[0]['titre'];

        $this->getJson('/api/actualites')
            ->assertOk()
            ->assertJsonFragment(['titre' => $titre]);
    }

    public function test_ne_duplique_pas_et_garde_les_retouches_du_backoffice(): void
    {
        $this->seed(ActualitesSeeder::class);

        $actualite = Contenu::where('type', 'actualite')->first();
        $actualite->update(['contenu' => 'Texte retouché dans le BO']);

        $this->seed(ActualitesSeeder::class);

        $this->assertSame(count(ActualitesSeeder::actualites()), Contenu::where('type', 'actualite')->count());
        $this->assertSame('Texte retouché dans le BO', $actualite->fresh()->contenu);
    }
}
