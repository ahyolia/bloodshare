<?php

namespace Tests\Unit;

use App\Models\Defi;
use App\Models\Don;
use App\Models\User;
use App\Models\UserDefi;
use App\Services\DefiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class DefiServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(10, 0));
    }

    public function test_ne_fait_rien_sans_defi_actif(): void
    {
        $this->creerDefi(['statut' => 'brouillon']);
        $user = User::factory()->create();

        app(DefiService::class)->enregistrerContribution($user);

        $this->assertDatabaseCount('user_defis', 0);
    }

    public function test_enregistre_la_contribution_d_un_donneur(): void
    {
        $defi = $this->creerDefi();
        $user = User::factory()->create();

        app(DefiService::class)->enregistrerContribution($user);

        $this->assertDatabaseHas('user_defis', ['user_id' => $user->id, 'defi_id' => $defi->id, 'progression' => 1, 'complete' => false]);
    }

    public function test_cumule_les_contributions_sur_une_seule_ligne(): void
    {
        $defi = $this->creerDefi();
        $user = User::factory()->create();

        app(DefiService::class)->enregistrerContribution($user);
        app(DefiService::class)->enregistrerContribution($user);

        $this->assertSame(2, UserDefi::where('user_id', $user->id)->where('defi_id', $defi->id)->sole()->progression);
    }

    public function test_reste_actif_tant_que_l_objectif_n_est_pas_atteint(): void
    {
        $defi = $this->creerDefi(['objectif_chiffre' => 3]);
        $user = $this->donneurAvecDon();

        app(DefiService::class)->enregistrerContribution($user);

        $this->assertSame('actif', $defi->fresh()->statut);
    }

    public function test_termine_le_defi_et_distribue_les_points_quand_l_objectif_est_atteint(): void
    {
        $defi = $this->creerDefi(['objectif_chiffre' => 2, 'points_attribues' => 30]);
        $premier = $this->donneurAvecDon();
        app(DefiService::class)->enregistrerContribution($premier);
        $second = $this->donneurAvecDon();

        app(DefiService::class)->enregistrerContribution($second);

        $this->assertSame('termine', $defi->fresh()->statut);
        foreach ([$premier, $second] as $user) {
            $this->assertSame(30, $user->fresh()->points_cumules);
            $this->assertDatabaseHas('points_historique', ['user_id' => $user->id, 'points' => 30, 'source' => 'defi']);
            $this->assertTrue(UserDefi::where('user_id', $user->id)->sole()->complete);
        }
    }

    public function test_ne_compte_que_les_dons_valides_du_mois_en_cours(): void
    {
        $defi = $this->creerDefi(['objectif_chiffre' => 2]);
        $user = User::factory()->create();
        Don::create(['user_id' => $user->id, 'date_don' => now()->subMonth(), 'statut' => 'valide']);
        Don::create(['user_id' => $user->id, 'date_don' => now(), 'statut' => 'en_attente']);
        Don::create(['user_id' => $user->id, 'date_don' => now(), 'statut' => 'valide']);

        app(DefiService::class)->enregistrerContribution($user);

        $this->assertSame('actif', $defi->fresh()->statut);
    }

    public function test_ne_distribue_aucun_point_si_le_defi_n_en_prevoit_pas(): void
    {
        $defi = $this->creerDefi(['objectif_chiffre' => 1, 'points_attribues' => 0]);
        $user = $this->donneurAvecDon();

        app(DefiService::class)->enregistrerContribution($user);

        $this->assertSame('termine', $defi->fresh()->statut);
        $this->assertDatabaseCount('points_historique', 0);
    }

    public function test_un_defi_sans_objectif_chiffre_ne_se_termine_jamais(): void
    {
        $defi = $this->creerDefi(['objectif_chiffre' => null]);

        app(DefiService::class)->enregistrerContribution($this->donneurAvecDon());

        $this->assertSame('actif', $defi->fresh()->statut);
    }

    public function test_ne_redistribue_pas_les_points_d_un_defi_deja_termine(): void
    {
        $defi = $this->creerDefi(['objectif_chiffre' => 1, 'points_attribues' => 30]);
        $user = $this->donneurAvecDon();
        app(DefiService::class)->enregistrerContribution($user);

        // Le défi est terminé : un nouveau don ne trouve plus de défi actif.
        app(DefiService::class)->enregistrerContribution($this->donneurAvecDon());

        $this->assertSame(30, $user->fresh()->points_cumules);
        $this->assertSame(1, UserDefi::where('defi_id', $defi->id)->count());
    }

    private function creerDefi(array $attributs = []): Defi
    {
        return Defi::create(array_merge([
            'titre' => 'Défi du mois',
            'type' => 'communautaire',
            'periode' => 'mensuel',
            'objectif_chiffre' => 10,
            'points_attribues' => 20,
            'statut' => 'actif',
        ], $attributs));
    }

    private function donneurAvecDon(): User
    {
        $user = User::factory()->create(['points_cumules' => 0]);
        Don::create(['user_id' => $user->id, 'date_don' => now(), 'statut' => 'valide']);

        return $user;
    }
}
