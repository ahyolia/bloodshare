<?php

namespace Tests\Feature;

use App\Models\Carte;
use App\Models\Defi;
use App\Models\Don;
use App\Models\Parrainage;
use App\Models\QrCode;
use App\Models\User;
use App\Models\UserCarte;
use App\Services\QrCentreTournant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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

    public function test_verrouille_la_ligne_utilisateur_avant_de_controler_l_eligibilite(): void
    {
        // 📖 Une vraie course entre deux requêtes ne se reproduit pas dans un seul process
        //    PHPUnit : on vérifie que le verrou est pris, et avant la lecture des dons.
        //    Sans lui, 8 scans simultanés créaient 5 dons (reproduit avec curl en parallèle).
        $this->connecter('homme');
        $this->creerCarteDuMois();
        $qr = $this->creerQrCentre();

        $requetes = [];
        DB::listen(function ($query) use (&$requetes) {
            $requetes[] = $query->sql;
        });

        $this->scanner($qr)->assertOk();

        $verrou = collect($requetes)->search(fn ($sql) => str_contains($sql, 'from "users"') && str_contains($sql, 'for update'));
        $lectureDons = collect($requetes)->search(fn ($sql) => str_contains($sql, 'from "dons"'));

        $this->assertNotFalse($verrou, 'Le scan doit verrouiller la ligne utilisateur.');
        $this->assertLessThan($lectureDons, $verrou);
    }

    // ── QR centre tournant ──────────────────────────────────────

    public function test_refuse_le_token_brut_du_qr_centre(): void
    {
        // 📖 Ce que contenaient les anciens QR imprimés : il ne doit plus valider de don.
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $qr = $this->creerQrCentre();

        $this->postJson('/api/scan', ['token' => $qr->token])->assertNotFound();

        $this->assertDatabaseMissing('dons', ['user_id' => $user->id]);
    }

    public function test_accepte_le_jeton_de_la_fenetre_precedente(): void
    {
        $this->connecter('homme');
        $this->creerCarteDuMois();
        $jeton = app(QrCentreTournant::class)->jetonCourant($this->creerQrCentre());

        $this->travel(QrCentreTournant::PERIODE_SECONDES)->seconds();

        $this->postJson('/api/scan', ['token' => $jeton])->assertOk();
    }

    public function test_refuse_un_jeton_expire(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $jeton = app(QrCentreTournant::class)->jetonCourant($this->creerQrCentre());

        $this->travel(2 * QrCentreTournant::PERIODE_SECONDES)->seconds();

        $this->postJson('/api/scan', ['token' => $jeton])->assertNotFound();
        $this->assertDatabaseMissing('dons', ['user_id' => $user->id]);
    }

    public function test_refuse_un_jeton_a_la_signature_falsifiee(): void
    {
        $this->connecter('homme');
        $this->creerCarteDuMois();
        $jeton = app(QrCentreTournant::class)->jetonCourant($this->creerQrCentre());

        [$prefixe, $fenetre] = explode('.', $jeton);

        $this->postJson('/api/scan', ['token' => "{$prefixe}.{$fenetre}." . str_repeat('0', 20)])
            ->assertNotFound();
    }

    public function test_refuse_le_jeton_d_un_qr_centre_regenere(): void
    {
        $this->connecter('homme');
        $this->creerCarteDuMois();
        $ancien = $this->creerQrCentre();
        $jeton = app(QrCentreTournant::class)->jetonCourant($ancien);

        $ancien->update(['actif' => false]);
        $this->creerQrCentre();

        $this->postJson('/api/scan', ['token' => $jeton])->assertNotFound();
    }

    public function test_refuse_le_qr_de_secours_hors_mode_secours(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $qr = $this->creerQrCentre();

        $this->postJson('/api/scan', ['token' => app(QrCentreTournant::class)->jetonSecours($qr)])
            ->assertNotFound();
        $this->assertDatabaseMissing('dons', ['user_id' => $user->id]);
    }

    public function test_accepte_le_qr_de_secours_pendant_le_mode_secours(): void
    {
        $this->connecter('homme');
        $this->creerCarteDuMois();
        $qr = $this->creerQrCentre();
        $qr->update(['secours_jusqu_a' => now()->endOfDay()]);

        $this->postJson('/api/scan', ['token' => app(QrCentreTournant::class)->jetonSecours($qr)])
            ->assertOk()
            ->assertJsonPath('type', 'don');
    }

    public function test_le_mode_secours_s_arrete_a_la_fin_de_la_journee(): void
    {
        $this->connecter('homme');
        $this->creerCarteDuMois();
        $qr = $this->creerQrCentre();
        $qr->update(['secours_jusqu_a' => now()->endOfDay()]);

        $this->travelTo(now()->addDay()->startOfDay());

        $this->postJson('/api/scan', ['token' => app(QrCentreTournant::class)->jetonSecours($qr)])
            ->assertNotFound();
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
            'statut' => 'actif',
        ]);

        $this->scanner($this->creerQrCentre())->assertOk();

        $this->assertSame(0, (int) $user->fresh()->points_cumules);
        $this->assertDatabaseMissing('points_historique', ['user_id' => $user->id]);
    }

    // ── Carte Fidèle (ancienneté) ───────────────────────────────
    // 📖 La carte Fidèle est créée par la migration add_carte_fidele.

    public function test_donne_la_carte_fidele_au_premier_don_un_an_apres_le_premier(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subYear());

        $this->scanner($this->creerQrCentre())
            ->assertOk()
            ->assertJsonPath('carte_fidele.categorie', 'fidele')
            ->assertJsonPath('carte_obtenue.categorie', 'mois_don');

        $this->assertTrue(UserCarte::where('user_id', $user->id)->where('carte_id', $this->carteFidele()->id)->exists());
    }

    public function test_pas_de_carte_fidele_avant_un_an_d_anciennete(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subYear()->addDay());

        $this->scanner($this->creerQrCentre())->assertOk()->assertJsonPath('carte_fidele', null);
    }

    public function test_un_don_non_valide_ne_compte_pas_pour_l_anciennete(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subYears(2), 'en_attente');

        $this->scanner($this->creerQrCentre())->assertOk()->assertJsonPath('carte_fidele', null);
    }

    public function test_la_carte_fidele_n_est_donnee_qu_une_fois(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subYears(2));
        $qr = $this->creerQrCentre();
        $this->scanner($qr)->assertJsonPath('carte_fidele.categorie', 'fidele');

        // Un an plus tard : de nouveau octobre, la seule carte du mois créée ici.
        $this->travel(1)->years();
        $this->scanner($qr)->assertOk()->assertJsonPath('carte_fidele', null);

        $this->assertSame(1, UserCarte::where('user_id', $user->id)->where('carte_id', $this->carteFidele()->id)->sole()->quantite);
    }

    public function test_pas_de_carte_fidele_si_elle_est_desactivee(): void
    {
        $user = $this->connecter('homme');
        $this->creerCarteDuMois();
        $this->creerDon($user, now()->subYears(2));
        $this->carteFidele()->update(['statut' => 'desactivee']);

        $this->scanner($this->creerQrCentre())->assertOk()->assertJsonPath('carte_fidele', null);
    }

    private function carteFidele(): Carte
    {
        return Carte::where('categorie', 'fidele')->sole();
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
        return $this->postJson('/api/scan', ['token' => app(QrCentreTournant::class)->jetonCourant($qr)]);
    }
}
