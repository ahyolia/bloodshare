<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Carte;
use App\Models\Evenement;
use App\Models\QrCode;
use App\Models\QrCodeScan;
use App\Models\User;
use App\Models\UserCarte;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScanEvenementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(10, 0));
        Notification::fake();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_donne_la_carte_evenement_pour_un_evenement_publie_en_cours(): void
    {
        $carte = $this->creerCarteEvenement();
        $evenement = $this->creerEvenement();

        $this->scanner($this->creerQrEvenement($evenement))
            ->assertOk()
            ->assertJsonPath('type', 'evenement')
            ->assertJsonPath('evenement.id', $evenement->id)
            ->assertJsonPath('carte_obtenue.id', $carte->id)
            ->assertJsonPath('carte_obtenue.quantite', 1);
    }

    public function test_n_enregistre_pas_de_don_pour_un_scan_evenement(): void
    {
        $this->creerCarteEvenement();

        $this->scanner($this->creerQrEvenement($this->creerEvenement()))->assertOk();

        $this->assertDatabaseMissing('dons', ['user_id' => $this->user->id]);
    }

    public function test_incremente_la_quantite_a_chaque_nouvel_evenement(): void
    {
        $carte = $this->creerCarteEvenement();

        $this->scanner($this->creerQrEvenement($this->creerEvenement()))->assertOk();
        $this->scanner($this->creerQrEvenement($this->creerEvenement()))
            ->assertOk()
            ->assertJsonPath('carte_obtenue.quantite', 2);

        $this->assertSame(1, UserCarte::where('user_id', $this->user->id)->where('carte_id', $carte->id)->count());
    }

    public function test_refuse_un_second_scan_du_meme_evenement(): void
    {
        $carte = $this->creerCarteEvenement();
        $qr = $this->creerQrEvenement($this->creerEvenement());

        $this->scanner($qr)->assertOk();
        $this->scanner($qr)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Ta participation à cet événement est déjà validée.');

        $this->assertSame(1, UserCarte::where('user_id', $this->user->id)->where('carte_id', $carte->id)->sole()->quantite);
        $this->assertSame(1, QrCodeScan::where('user_id', $this->user->id)->count());
    }

    public function test_un_autre_participant_peut_scanner_le_meme_evenement(): void
    {
        $this->creerCarteEvenement();
        $qr = $this->creerQrEvenement($this->creerEvenement());
        $this->scanner($qr)->assertOk();

        Sanctum::actingAs(User::factory()->create());

        $this->scanner($qr)->assertOk();
    }

    public function test_un_scan_refuse_ne_bloque_pas_la_participation_une_fois_l_evenement_publie(): void
    {
        $this->creerCarteEvenement();
        $evenement = $this->creerEvenement(['statut' => 'brouillon']);
        $qr = $this->creerQrEvenement($evenement);

        $this->scanner($qr)->assertUnprocessable();
        $this->assertSame(0, QrCodeScan::where('user_id', $this->user->id)->count());

        $evenement->update(['statut' => 'publie']);
        $this->scanner($qr)->assertOk();
    }

    public function test_refuse_un_evenement_annule(): void
    {
        $this->creerCarteEvenement();

        $this->scanner($this->creerQrEvenement($this->creerEvenement(['statut' => 'annule'])))
            ->assertUnprocessable();

        $this->assertDatabaseMissing('user_cartes', ['user_id' => $this->user->id]);
    }

    public function test_refuse_un_evenement_en_brouillon(): void
    {
        $this->creerCarteEvenement();

        $this->scanner($this->creerQrEvenement($this->creerEvenement(['statut' => 'brouillon'])))
            ->assertUnprocessable();
    }

    public function test_refuse_un_evenement_dont_l_horaire_de_fin_est_passe(): void
    {
        $this->creerCarteEvenement();
        $evenement = $this->creerEvenement([
            'date_heure' => now()->subHours(5),
            'horaire_fin' => now()->subHour(),
        ]);

        $this->scanner($this->creerQrEvenement($evenement))->assertUnprocessable();
    }

    public function test_refuse_un_evenement_passe_sans_horaire_de_fin(): void
    {
        $this->creerCarteEvenement();
        $evenement = $this->creerEvenement(['date_heure' => now()->subHour(), 'horaire_fin' => null]);

        $this->scanner($this->creerQrEvenement($evenement))->assertUnprocessable();
    }

    public function test_accepte_un_evenement_commence_mais_pas_encore_termine(): void
    {
        $this->creerCarteEvenement();
        $evenement = $this->creerEvenement([
            'date_heure' => now()->subHour(),
            'horaire_fin' => now()->addHour(),
        ]);

        $this->scanner($this->creerQrEvenement($evenement))->assertOk();
    }

    public function test_repond_sans_carte_si_aucune_carte_evenement_n_est_active(): void
    {
        $this->scanner($this->creerQrEvenement($this->creerEvenement()))
            ->assertOk()
            ->assertJsonPath('carte_obtenue', null);
    }

    public function test_annonce_le_badge_trois_cartes_evenement_au_troisieme_scan(): void
    {
        $this->creerCarteEvenement();
        // 📖 « Toujours partant » est inséré par la migration seed_cartes_et_quiz_badges.
        $badge = Badge::where('action_specifique', 'trois_cartes_evenement')->firstOrFail();

        $this->scanner($this->creerQrEvenement($this->creerEvenement()))->assertJsonCount(0, 'badges_debloques');
        $this->scanner($this->creerQrEvenement($this->creerEvenement()))->assertJsonCount(0, 'badges_debloques');
        $this->scanner($this->creerQrEvenement($this->creerEvenement()))
            ->assertJsonCount(1, 'badges_debloques')
            ->assertJsonPath('badges_debloques.0.id', $badge->id);
    }

    public function test_donne_la_carte_propre_a_l_evenement_quand_il_en_designe_une(): void
    {
        $this->creerCarteEvenement();
        $carteForum = $this->creerCarteEvenement(['titre' => 'Carte Forum', 'generique' => false]);
        $evenement = $this->creerEvenement(['carte_id' => $carteForum->id]);

        $this->scanner($this->creerQrEvenement($evenement))
            ->assertOk()
            ->assertJsonPath('carte_obtenue.id', $carteForum->id)
            ->assertJsonPath('carte_obtenue.titre', 'Carte Forum');
    }

    public function test_un_evenement_sans_carte_propre_ne_donne_jamais_une_carte_non_generique(): void
    {
        // 📖 Créée en premier et rattachée à aucun événement : sans le marqueur `generique`,
        //    la carte du forum serait « la plus ancienne » et remise à tous les événements.
        $this->creerCarteEvenement(['titre' => 'Carte Forum', 'generique' => false]);
        $generique = $this->creerCarteEvenement();

        $this->scanner($this->creerQrEvenement($this->creerEvenement()))
            ->assertOk()
            ->assertJsonPath('carte_obtenue.id', $generique->id);
    }

    public function test_retombe_sur_la_carte_generique_si_la_carte_propre_est_desactivee(): void
    {
        $generique = $this->creerCarteEvenement();
        $carteForum = $this->creerCarteEvenement(['titre' => 'Carte Forum', 'generique' => false, 'statut' => 'desactivee']);
        $evenement = $this->creerEvenement(['carte_id' => $carteForum->id]);

        $this->scanner($this->creerQrEvenement($evenement))
            ->assertOk()
            ->assertJsonPath('carte_obtenue.id', $generique->id);
    }

    private function creerEvenement(array $attributs = []): Evenement
    {
        return Evenement::create(array_merge([
            'titre' => 'Collecte au marché',
            'lieu' => 'Nouméa',
            'date_heure' => now()->subHour(),
            'horaire_fin' => now()->addHours(3),
            'statut' => 'publie',
        ], $attributs));
    }

    private function creerQrEvenement(Evenement $evenement): QrCode
    {
        return QrCode::create([
            'type' => 'evenement',
            'token' => 'evenement-' . uniqid(),
            'evenement_id' => $evenement->id,
            'actif' => true,
        ]);
    }

    private function creerCarteEvenement(array $attributs = []): Carte
    {
        return Carte::create(array_merge([
            'titre' => 'Carte événement',
            'categorie' => 'evenement',
            'statut' => 'active',
            'generique' => true,
        ], $attributs));
    }

    private function scanner(QrCode $qr)
    {
        return $this->postJson('/api/scan', ['token' => $qr->token]);
    }
}
