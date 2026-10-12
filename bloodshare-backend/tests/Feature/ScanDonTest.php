<?php

namespace Tests\Feature;

use App\Models\Carte;
use App\Models\Defi;
use App\Models\Don;
use App\Models\Parrainage;
use App\Models\QrCode;
use App\Models\User;
use App\Models\UserCarte;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScanDonTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // 📖 Date figée : la carte du mois dépend de now(), et les délais d'éligibilité
        //    se testent au jour près.
        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(10, 0));
    }

    public function test_enregistre_le_don_et_donne_la_carte_du_mois(): void
    {
        $user = $this->connecter('homme');
        $carte = $this->creerCarteDuMois();

        $reponse = $this->scanner($this->creerQrCentre());

        $reponse->assertOk()
            ->assertJsonPath('type', 'don')
            ->assertJsonPath('carte_obtenue.id', $carte->id)
            ->assertJsonPath('carte_obtenue.deja_possedee', false);
        $this->assertDatabaseHas('dons', ['user_id' => $user->id, 'statut' => 'valide']);
        $this->assertDatabaseHas('user_cartes', ['user_id' => $user->id, 'carte_id' => $carte->id]);
    }

    public function test_refuse_un_qr_code_inconnu(): void
    {
        $this->connecter('homme');

        $this->postJson('/api/scan', ['token' => 'token-inexistant'])
            ->assertNotFound();
    }

    public function test_refuse_un_qr_code_desactive(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();

        $this->scanner($this->creerQrCentre(actif: false))->assertNotFound();

        $this->assertDatabaseMissing('dons', ['user_id' => $user->id]);
    }

    public function test_refuse_une_requete_sans_token(): void
    {
        $this->connecter('homme');

        $this->postJson('/api/scan', [])->assertUnprocessable();
    }

    public function test_refuse_un_utilisateur_non_connecte(): void
    {
        $this->scanner($this->creerQrCentre())->assertUnauthorized();
    }

    public function test_refuse_un_homme_qui_a_donne_il_y_a_55_jours(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subDays(55));

        $this->scanner($this->creerQrCentre())
            ->assertUnprocessable()
            ->assertJsonPath('prochaine_eligibilite', now()->addDay()->toDateString());

        $this->assertSame(1, Don::where('user_id', $user->id)->count());
    }

    public function test_accepte_un_homme_qui_a_donne_il_y_a_56_jours(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subDays(56));

        $this->scanner($this->creerQrCentre())->assertOk();

        $this->assertSame(2, Don::where('user_id', $user->id)->count());
    }

    public function test_refuse_une_femme_qui_a_donne_il_y_a_83_jours(): void
    {
        $user = $this->connecter('femme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subDays(83));

        $this->scanner($this->creerQrCentre())
            ->assertUnprocessable()
            ->assertJsonPath('prochaine_eligibilite', now()->addDay()->toDateString());
    }

    public function test_accepte_une_femme_qui_a_donne_il_y_a_84_jours(): void
    {
        $user = $this->connecter('femme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subDays(84));

        $this->scanner($this->creerQrCentre())->assertOk();
    }

    public function test_ignore_un_ancien_don_non_valide_pour_l_eligibilite(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subDays(10), 'en_attente');

        $this->scanner($this->creerQrCentre())->assertOk();
    }

    public function test_refuse_un_second_scan_le_meme_jour(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $qr = $this->creerQrCentre();

        $this->scanner($qr)->assertOk();
        $this->scanner($qr)->assertUnprocessable();

        $this->assertSame(1, Don::where('user_id', $user->id)->count());
    }

    public function test_n_enregistre_pas_le_don_si_la_carte_du_mois_manque(): void
    {
        $user = $this->connecter('homme');

        $this->scanner($this->creerQrCentre())->assertStatus(503);

        $this->assertDatabaseMissing('dons', ['user_id' => $user->id]);
    }

    public function test_signale_une_carte_du_mois_deja_possedee_sans_la_dupliquer(): void
    {
        $user = $this->connecter('homme');
        $carte = $this->creerCarteDuMois();
        UserCarte::create([
            'user_id' => $user->id,
            'carte_id' => $carte->id,
            'quantite' => 1,
            'obtenue_at' => now()->subYear(),
        ]);

        $this->scanner($this->creerQrCentre())
            ->assertOk()
            ->assertJsonPath('carte_obtenue.deja_possedee', true);

        $this->assertSame(1, UserCarte::where('user_id', $user->id)->count());
    }

    // 📖 Garde-fou de la règle éthique ADSB-NC (CONTRIBUTING.md) : un don ne rapporte jamais
    //    de points, même quand il valide un parrainage et fait atteindre l'objectif d'un défi.
    public function test_un_don_ne_rapporte_jamais_de_points_au_donneur(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        Parrainage::create([
            'parrain_id' => User::factory()->create()->id,
            'filleul_id' => $user->id,
            'statut' => 'en_attente',
        ]);
        Defi::create([
            'titre' => 'Défi',
            'type' => 'communautaire',
            'periode' => 'mensuel',
            'objectif_chiffre' => 1,
            'points_attribues' => 30,
            'statut' => 'actif',
        ]);

        $this->scanner($this->creerQrCentre())->assertOk();

        $this->assertSame(0, (int) $user->fresh()->points_cumules);
        $this->assertDatabaseMissing('points_historique', ['user_id' => $user->id]);
    }

    private function connecter(string $sexe): User
    {
        $user = User::factory()->create(['sexe' => $sexe]);
        Sanctum::actingAs($user);

        return $user;
    }

    private function creerQrCentre(bool $actif = true): QrCode
    {
        return QrCode::create([
            'type' => 'centre',
            'token' => 'centre-' . uniqid(),
            'actif' => $actif,
        ]);
    }

    private function creerCarteDuMois(): Carte
    {
        return Carte::create([
            'titre' => 'Carte d\'octobre',
            'categorie' => 'mois_don',
            'mois_numero' => 10,
            'statut' => 'active',
        ]);
    }

    private function creerDon(User $user, $date, string $statut = 'valide'): Don
    {
        return Don::create(['user_id' => $user->id, 'date_don' => $date, 'statut' => $statut]);
    }

    private function scanner(QrCode $qr)
    {
        return $this->postJson('/api/scan', ['token' => $qr->token]);
    }
}
