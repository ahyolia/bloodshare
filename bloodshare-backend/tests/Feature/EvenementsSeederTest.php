<?php

namespace Tests\Feature;

use App\Models\Carte;
use App\Models\Evenement;
use Database\Seeders\EvenementsSeeder;
use Database\Seeders\VisuelsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EvenementsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_cree_l_evenement_publie_avec_son_qr_code_et_sa_carte(): void
    {
        Notification::fake();
        // Déjà posée par les migrations de visuels : créée seulement si elle manque.
        $carte = Carte::firstOrCreate(
            ['titre' => VisuelsSeeder::TITRE_CARTE_FORUM],
            ['categorie' => 'evenement', 'statut' => 'active']
        );

        $this->seed(EvenementsSeeder::class);

        $evenement = Evenement::with('qrCode')->firstOrFail();
        $this->assertSame('publie', $evenement->statut);
        $this->assertSame($carte->id, $evenement->carte_id);
        $this->assertSame('evenement', $evenement->qrCode->type);
        $this->assertSame($evenement->id, $evenement->qrCode->evenement_id);
        $this->assertTrue($evenement->qrCode->actif);
    }

    public function test_ne_duplique_pas_et_garde_les_retouches_du_backoffice(): void
    {
        Notification::fake();
        $this->seed(EvenementsSeeder::class);

        $evenement = Evenement::firstOrFail();
        $evenement->update(['lieu' => 'Lieu retouché dans le BO']);

        $this->seed(EvenementsSeeder::class);

        $this->assertSame(count(EvenementsSeeder::evenements()), Evenement::count());
        $this->assertSame('Lieu retouché dans le BO', $evenement->fresh()->lieu);
        $this->assertDatabaseCount('qr_codes', count(EvenementsSeeder::evenements()));
    }
}
