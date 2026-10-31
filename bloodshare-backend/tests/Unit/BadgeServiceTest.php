<?php

namespace Tests\Unit;

use App\Models\Badge;
use App\Models\Carte;
use App\Models\Defi;
use App\Models\Don;
use App\Models\Parrainage;
use App\Models\Quiz;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserCarte;
use App\Models\UserDefi;
use App\Models\UserQuiz;
use App\Notifications\BadgeDebloqueNotification;
use App\Services\BadgeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BadgeServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        // 📖 Des migrations insèrent déjà des badges (seed_cartes_et_quiz_badges,
        //    seed_defis_badges) : on repart d'une table vide pour que chaque test ne voie
        //    que le badge qu'il crée.
        Badge::query()->delete();

        $this->user = User::factory()->create();
    }

    // ── Badges « nombre de dons » ───────────────────────────────

    public function test_n_attribue_rien_a_un_utilisateur_sans_activite(): void
    {
        $this->badgeNbDons(1);

        $this->assertSame([], $this->synchroniser());
    }

    public function test_attribue_le_badge_premier_don_apres_un_don_valide(): void
    {
        $badge = $this->badgeNbDons(1);
        $this->creerDons(1);

        $nouveaux = $this->synchroniser();

        $this->assertCount(1, $nouveaux);
        $this->assertSame($badge->id, $nouveaux[0]['id']);
        $this->assertDatabaseHas('user_badges', ['user_id' => $this->user->id, 'badge_id' => $badge->id]);
    }

    public function test_n_attribue_pas_un_badge_nb_dons_avant_le_seuil(): void
    {
        $this->badgeNbDons(3);
        $this->creerDons(2);

        $this->assertSame([], $this->synchroniser());
    }

    public function test_ignore_les_dons_non_valides(): void
    {
        $this->badgeNbDons(1);
        Don::create(['user_id' => $this->user->id, 'date_don' => now(), 'statut' => 'en_attente']);

        $this->assertSame([], $this->synchroniser());
    }

    public function test_n_attribue_jamais_deux_fois_le_meme_badge(): void
    {
        $this->badgeNbDons(1);
        $this->creerDons(1);

        $this->synchroniser();
        $this->assertSame([], $this->synchroniser());

        $this->assertSame(1, UserBadge::where('user_id', $this->user->id)->count());
    }

    public function test_n_attribue_pas_un_badge_inactif(): void
    {
        $this->badgeNbDons(1, 'inactif');
        $this->creerDons(1);

        $this->assertSame([], $this->synchroniser());
    }

    public function test_rattrape_plusieurs_badges_d_un_coup(): void
    {
        $this->badgeNbDons(1);
        $this->badgeNbDons(3);
        $this->creerDons(3);

        $this->assertCount(2, $this->synchroniser());
    }

    public function test_notifie_l_utilisateur_du_badge_debloque(): void
    {
        $this->badgeNbDons(1);
        $this->creerDons(1);

        $this->synchroniser();

        Notification::assertSentTo($this->user, BadgeDebloqueNotification::class);
    }

    // ── Parrainage ──────────────────────────────────────────────

    public function test_premier_parrainage_exige_un_parrainage_valide(): void
    {
        $this->badgeAction('premier_parrainage');
        $this->creerParrainage('en_attente');
        $this->assertSame([], $this->synchroniser());

        $this->creerParrainage('valide');
        $this->assertCount(1, $this->synchroniser());
    }

    public function test_trois_parrainages_exige_trois_filleuls_valides(): void
    {
        $this->badgeAction('trois_parrainages');
        $this->creerParrainage('valide');
        $this->creerParrainage('valide');
        $this->assertSame([], $this->synchroniser());

        $this->creerParrainage('valide');
        $this->assertCount(1, $this->synchroniser());
    }

    public function test_inscrit_avec_code_est_donne_au_filleul_meme_en_attente(): void
    {
        $this->badgeAction('inscrit_avec_code');
        Parrainage::create([
            'parrain_id' => User::factory()->create()->id,
            'filleul_id' => $this->user->id,
            'statut' => 'en_attente',
        ]);

        $this->assertCount(1, $this->synchroniser());
    }

    // ── Quiz ────────────────────────────────────────────────────

    public function test_premier_quiz_et_cinq_quiz_selon_le_nombre_de_quiz_completes(): void
    {
        $this->badgeAction('premier_quiz');
        $this->badgeAction('cinq_quiz');

        $this->completerQuiz(1);
        $this->assertSame(['premier_quiz'], array_column($this->synchroniser(), 'action_specifique'));

        $this->completerQuiz(4);
        $this->assertSame(['cinq_quiz'], array_column($this->synchroniser(), 'action_specifique'));
    }

    public function test_toutes_categories_quiz_exige_tous_les_quiz_actifs_completes(): void
    {
        $this->badgeAction('toutes_categories_quiz');
        $this->completerQuiz(2);
        $this->creerQuiz();

        $this->assertSame([], $this->synchroniser());

        UserQuiz::create(['user_id' => $this->user->id, 'quiz_id' => Quiz::latest('id')->first()->id, 'complete' => true]);
        $this->assertCount(1, $this->synchroniser());
    }

    public function test_toutes_categories_quiz_n_est_pas_donne_s_il_n_existe_aucun_quiz_actif(): void
    {
        $this->badgeAction('toutes_categories_quiz');

        $this->assertSame([], $this->synchroniser());
    }

    public function test_un_quiz_complete_puis_desactive_ne_compte_plus(): void
    {
        $this->badgeAction('premier_quiz');
        $this->completerQuiz(1)[0]->update(['statut' => 'inactif']);

        $this->assertSame([], $this->synchroniser());
    }

    // ── Cartes ──────────────────────────────────────────────────

    public function test_six_cartes_mois_compte_les_mois_distincts(): void
    {
        $this->badgeAction('six_cartes_mois');
        $this->donnerCartesMois(2026, [1, 3, 5, 7, 9]);
        $this->assertSame([], $this->synchroniser());

        $this->donnerCartesMois(2026, [11]);
        $this->assertCount(1, $this->synchroniser());
    }

    public function test_le_meme_mois_de_deux_collections_ne_compte_qu_une_fois(): void
    {
        $this->badgeAction('six_cartes_mois');
        $this->donnerCartesMois(2026, [1, 3, 5, 7, 9]);
        $this->donnerCartesMois(2027, [1, 3, 5, 7, 9]);

        $this->assertSame([], $this->synchroniser());
    }

    public function test_douze_cartes_mois_se_complete_sur_plusieurs_annees(): void
    {
        // 📖 56 à 84 jours entre deux dons : les 12 mois ne tiennent pas dans une seule année.
        $this->badgeAction('douze_cartes_mois');
        $this->donnerCartesMois(2026, [1, 3, 5, 7, 9, 11]);
        $this->donnerCartesMois(2027, [2, 4, 6, 8, 10]);
        $this->assertSame([], $this->synchroniser());

        $this->donnerCartesMois(2028, [12]);
        $this->assertCount(1, $this->synchroniser());
    }

    public function test_trois_cartes_evenement_compte_la_quantite_cumulee(): void
    {
        $this->badgeAction('trois_cartes_evenement');
        $carte = Carte::create(['titre' => 'Événement', 'categorie' => 'evenement', 'statut' => 'active']);
        UserCarte::create(['user_id' => $this->user->id, 'carte_id' => $carte->id, 'quantite' => 2, 'obtenue_at' => now()]);
        $this->assertSame([], $this->synchroniser());

        UserCarte::where('user_id', $this->user->id)->increment('quantite');
        $this->assertCount(1, $this->synchroniser());
    }

    // ── Défis ───────────────────────────────────────────────────

    public function test_defi_contribue_des_qu_un_don_a_compte_pour_un_defi(): void
    {
        $this->badgeAction('defi_contribue');
        $this->badgeAction('defi_remporte');
        UserDefi::create(['user_id' => $this->user->id, 'defi_id' => $this->creerDefi()->id, 'progression' => 1, 'complete' => false]);

        $this->assertSame(['defi_contribue'], array_column($this->synchroniser(), 'action_specifique'));
    }

    public function test_defi_remporte_quand_le_defi_est_complete(): void
    {
        $this->badgeAction('defi_remporte');
        UserDefi::create(['user_id' => $this->user->id, 'defi_id' => $this->creerDefi()->id, 'progression' => 1, 'complete' => true]);

        $this->assertCount(1, $this->synchroniser());
    }

    // ── Outils ──────────────────────────────────────────────────

    private function synchroniser(): array
    {
        return app(BadgeService::class)->synchroniser($this->user);
    }

    private function badgeNbDons(int $valeur, string $statut = 'actif'): Badge
    {
        return Badge::create([
            'nom' => "{$valeur} don(s)",
            'condition_type' => 'nb_dons',
            'condition_valeur' => $valeur,
            'statut' => $statut,
        ]);
    }

    private function badgeAction(string $action): Badge
    {
        return Badge::create([
            'nom' => $action,
            'condition_type' => 'action_specifique',
            'action_specifique' => $action,
            'statut' => 'actif',
        ]);
    }

    private function creerDons(int $nombre): void
    {
        for ($i = 0; $i < $nombre; $i++) {
            Don::create(['user_id' => $this->user->id, 'date_don' => now()->subDays(60 * $i), 'statut' => 'valide']);
        }
    }

    private function creerParrainage(string $statut): void
    {
        Parrainage::create([
            'parrain_id' => $this->user->id,
            'filleul_id' => User::factory()->create()->id,
            'statut' => $statut,
        ]);
    }

    private function creerQuiz(): Quiz
    {
        return Quiz::create(['titre' => 'Quiz', 'statut' => 'actif', 'points_attribues' => 10]);
    }

    /** @return Quiz[] */
    private function completerQuiz(int $nombre): array
    {
        $quiz = [];
        for ($i = 0; $i < $nombre; $i++) {
            $quiz[] = $q = $this->creerQuiz();
            UserQuiz::create(['user_id' => $this->user->id, 'quiz_id' => $q->id, 'complete' => true]);
        }

        return $quiz;
    }

    private function donnerCartesMois(int $annee, array $mois): void
    {
        foreach ($mois as $numero) {
            $carte = Carte::create(['titre' => "Carte {$numero} {$annee}", 'categorie' => 'mois_don', 'mois_numero' => $numero, 'annee' => $annee, 'statut' => 'active']);
            UserCarte::create(['user_id' => $this->user->id, 'carte_id' => $carte->id, 'quantite' => 1, 'obtenue_at' => now()]);
        }
    }

    private function creerDefi(): Defi
    {
        return Defi::create(['titre' => 'Défi', 'type' => 'communautaire', 'periode' => 'mensuel', 'statut' => 'actif']);
    }
}
