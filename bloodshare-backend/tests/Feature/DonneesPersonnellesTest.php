<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Carte;
use App\Models\Defi;
use App\Models\Don;
use App\Models\Parrainage;
use App\Models\PointsHistorique;
use App\Models\User;
use App\Models\UserCarte;
use App\Models\UserDefi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// 📖 Routes « Données personnelles » et « Gamification » en lecture seule : chaque
//    utilisateur ne doit voir que ce qui le concerne.
class DonneesPersonnellesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $autre;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(10, 0));

        $this->user = User::factory()->create(['points_cumules' => 0]);
        $this->autre = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    // ── Dons ────────────────────────────────────────────────────

    public function test_liste_mes_dons_du_plus_recent_au_plus_ancien(): void
    {
        Don::create(['user_id' => $this->user->id, 'date_don' => now()->subMonths(4), 'statut' => 'valide']);
        $recent = Don::create(['user_id' => $this->user->id, 'date_don' => now(), 'statut' => 'valide']);
        Don::create(['user_id' => $this->autre->id, 'date_don' => now(), 'statut' => 'valide']);

        $this->getJson('/api/dons')
            ->assertOk()
            ->assertJsonPath('total_dons', 2)
            ->assertJsonPath('data.0.id', $recent->id);
    }

    public function test_associe_au_don_la_carte_obtenue_au_meme_moment(): void
    {
        $carte = Carte::create(['titre' => 'Octobre', 'categorie' => 'mois_don', 'mois_numero' => 10, 'statut' => 'active']);
        Don::create(['user_id' => $this->user->id, 'date_don' => now(), 'statut' => 'valide']);
        UserCarte::create(['user_id' => $this->user->id, 'carte_id' => $carte->id, 'quantite' => 1, 'obtenue_at' => now()]);

        $this->getJson('/api/dons')->assertJsonPath('data.0.carte_obtenue.id', $carte->id);
    }

    // ── Cartes ──────────────────────────────────────────────────

    public function test_l_album_indique_les_cartes_obtenues_et_le_pourcentage(): void
    {
        $octobre = Carte::create(['titre' => 'Octobre', 'categorie' => 'mois_don', 'mois_numero' => 10, 'statut' => 'active']);
        Carte::create(['titre' => 'Novembre', 'categorie' => 'mois_don', 'mois_numero' => 11, 'statut' => 'active']);
        Carte::create(['titre' => 'Désactivée', 'categorie' => 'mois_don', 'mois_numero' => 12, 'statut' => 'desactivee']);
        UserCarte::create(['user_id' => $this->user->id, 'carte_id' => $octobre->id, 'quantite' => 1, 'obtenue_at' => now()]);

        $this->getJson('/api/cartes')
            ->assertOk()
            ->assertJsonCount(2, 'mois_don.cartes')
            ->assertJsonPath('mois_don.pourcentage_complete', 8.3)
            ->assertJsonPath('mois_don.cartes.0.obtenue', true)
            ->assertJsonPath('mois_don.cartes.1.obtenue', false);
    }

    public function test_l_album_donne_la_quantite_de_cartes_evenement(): void
    {
        $carte = Carte::create(['titre' => 'Événement', 'categorie' => 'evenement', 'statut' => 'active']);
        UserCarte::create(['user_id' => $this->user->id, 'carte_id' => $carte->id, 'quantite' => 3, 'obtenue_at' => now()]);

        $reponse = $this->getJson('/api/cartes')
            ->assertJsonPath('parrainage.carte_parrain', null);

        $cartesEvenement = collect($reponse->json('evenement.cartes'))->keyBy('id');
        $this->assertSame(3, $cartesEvenement[$carte->id]['quantite']);
    }

    // ── Badges ──────────────────────────────────────────────────

    public function test_liste_les_badges_actifs_et_rattrape_ceux_deja_merites(): void
    {
        Badge::query()->delete();
        Badge::create(['nom' => 'Premier don', 'condition_type' => 'nb_dons', 'condition_valeur' => 1, 'statut' => 'actif']);
        Badge::create(['nom' => 'Cinq dons', 'condition_type' => 'nb_dons', 'condition_valeur' => 5, 'statut' => 'actif']);
        Badge::create(['nom' => 'Retiré', 'condition_type' => 'nb_dons', 'condition_valeur' => 1, 'statut' => 'inactif']);
        // Don enregistré hors scan (BO, import) : aucun badge n'a encore été attribué.
        Don::create(['user_id' => $this->user->id, 'date_don' => now(), 'statut' => 'valide']);

        $reponse = $this->getJson('/api/badges')->assertOk()->assertJsonCount(2);

        $badges = collect($reponse->json())->keyBy('nom');
        $this->assertTrue($badges['Premier don']['obtenu']);
        $this->assertFalse($badges['Cinq dons']['obtenu']);
    }

    // ── Points ──────────────────────────────────────────────────

    public function test_renvoie_mon_historique_de_points_le_plus_recent_d_abord(): void
    {
        $this->user->update(['points_cumules' => 80]);
        PointsHistorique::create(['user_id' => $this->user->id, 'points' => 30, 'source' => 'quiz']);
        $this->travel(1)->minutes();
        PointsHistorique::create(['user_id' => $this->user->id, 'points' => 50, 'source' => 'parrainage']);
        PointsHistorique::create(['user_id' => $this->autre->id, 'points' => 999, 'source' => 'quiz']);

        $this->getJson('/api/points/historique')
            ->assertOk()
            ->assertJsonPath('points_cumules', 80)
            ->assertJsonCount(2, 'historique')
            ->assertJsonPath('historique.0.source', 'parrainage');
    }

    // ── Parrainage ──────────────────────────────────────────────

    public function test_renvoie_mon_code_et_le_nombre_de_filleuls_valides(): void
    {
        $this->user->forceFill(['code_parrainage' => 'MONCODE1'])->save();
        Parrainage::create(['parrain_id' => $this->user->id, 'filleul_id' => User::factory()->create()->id, 'statut' => 'valide']);
        Parrainage::create(['parrain_id' => $this->user->id, 'filleul_id' => User::factory()->create()->id, 'statut' => 'en_attente']);

        $this->getJson('/api/parrainage/code')
            ->assertOk()
            ->assertExactJson(['code' => 'MONCODE1', 'nb_parrainages_valides' => 1]);
    }

    // ── Défi actuel ─────────────────────────────────────────────

    public function test_renvoie_null_sans_defi(): void
    {
        $this->getJson('/api/defis/actuel')->assertOk();
        $this->assertSame('null', $this->getJson('/api/defis/actuel')->getContent());
    }

    public function test_n_affiche_pas_un_defi_en_brouillon(): void
    {
        Defi::create(['titre' => 'Brouillon', 'type' => 'communautaire', 'periode' => 'mensuel', 'statut' => 'brouillon']);

        $this->assertSame('null', $this->getJson('/api/defis/actuel')->getContent());
    }

    public function test_affiche_la_progression_collective_et_la_mienne(): void
    {
        $defi = Defi::create(['titre' => 'Octobre rouge', 'type' => 'communautaire', 'periode' => 'mensuel', 'objectif_chiffre' => 50, 'statut' => 'actif']);
        Don::create(['user_id' => $this->user->id, 'date_don' => now(), 'statut' => 'valide']);
        Don::create(['user_id' => $this->autre->id, 'date_don' => now(), 'statut' => 'valide']);
        Don::create(['user_id' => $this->autre->id, 'date_don' => now()->subMonths(2), 'statut' => 'valide']);
        UserDefi::create(['user_id' => $this->user->id, 'defi_id' => $defi->id, 'progression' => 1]);

        $this->getJson('/api/defis/actuel')
            ->assertOk()
            ->assertJsonPath('titre', 'Octobre rouge')
            ->assertJsonPath('progression_actuelle', 2)
            ->assertJsonPath('ma_progression', 1);
    }

    public function test_continue_d_afficher_un_defi_qui_vient_d_etre_remporte(): void
    {
        Defi::create(['titre' => 'Gagné', 'type' => 'communautaire', 'periode' => 'mensuel', 'statut' => 'termine']);

        $this->getJson('/api/defis/actuel')
            ->assertJsonPath('statut', 'termine')
            ->assertJsonPath('ma_progression', 0);
    }

    // ── Accès ───────────────────────────────────────────────────

    public function test_toutes_ces_routes_exigent_d_etre_connecte(): void
    {
        $this->app['auth']->forgetGuards();

        foreach (['/api/dons', '/api/cartes', '/api/badges', '/api/points/historique', '/api/parrainage/code', '/api/quiz', '/api/defis/actuel', '/api/notifications'] as $route) {
            $this->getJson($route)->assertUnauthorized();
        }
    }
}
