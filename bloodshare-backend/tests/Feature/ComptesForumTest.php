<?php

namespace Tests\Feature;

use App\Console\Commands\ComptesForum;
use App\Models\Don;
use App\Models\PointsHistorique;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComptesForumTest extends TestCase
{
    use RefreshDatabase;

    public function test_cree_les_20_comptes_du_forum(): void
    {
        $this->artisan('forum:comptes')->assertSuccessful();

        $this->assertSame(20, User::where('email', 'like', '%@' . ComptesForum::DOMAINE)->count());
    }

    public function test_un_visiteur_se_connecte_avec_l_identifiant_de_sa_carte(): void
    {
        $this->artisan('forum:comptes');

        $this->postJson('/api/auth/login', ['email' => 'globule@forum.aima', 'password' => 'Rouge2Plaisir'])
            ->assertOk()
            ->assertJsonPath('user.pseudo', 'Globule Farceur')
            ->assertJsonPath('user.points_cumules', 0);
    }

    public function test_la_remise_a_neuf_efface_ce_qu_a_fait_le_visiteur(): void
    {
        $this->artisan('forum:comptes');

        $compte = User::where('email', 'globule@forum.aima')->first();
        $compte->update(['pseudo' => 'Pseudo du visiteur', 'password' => 'AutreMdp1', 'points_cumules' => 150]);
        Don::create(['user_id' => $compte->id, 'date_don' => now(), 'statut' => 'valide']);
        PointsHistorique::create(['user_id' => $compte->id, 'points' => 150, 'source' => 'quiz']);
        $compte->createToken('mobile');

        $this->artisan('forum:comptes')->assertSuccessful();

        $neuf = User::where('email', 'globule@forum.aima')->first();
        $this->assertSame('Globule Farceur', $neuf->pseudo);
        $this->assertSame(0, (int) $neuf->points_cumules);
        $this->assertSame(0, Don::count());
        $this->assertSame(0, PointsHistorique::count());
        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->postJson('/api/auth/login', ['email' => 'globule@forum.aima', 'password' => 'Rouge2Plaisir'])->assertOk();
    }

    public function test_ne_touche_pas_aux_vrais_comptes(): void
    {
        $vrai = User::factory()->create(['email' => 'donneur@example.test']);

        $this->artisan('forum:comptes');
        $this->artisan('forum:comptes', ['--supprimer' => true])->assertSuccessful();

        $this->assertSame(0, User::where('email', 'like', '%@' . ComptesForum::DOMAINE)->count());
        $this->assertModelExists($vrai);
    }
}
