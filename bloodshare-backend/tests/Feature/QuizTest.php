<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\Reponse;
use App\Models\User;
use App\Models\UserQuiz;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuizTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Quiz $quiz;
    /** @var array<int, array{question: Question, bonne: Reponse, mauvaise: Reponse}> */
    private array $questions = [];

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->user = User::factory()->create(['points_cumules' => 0]);
        Sanctum::actingAs($this->user);

        // Quiz de 4 questions à choix unique, 40 points au sans-faute.
        $this->quiz = Quiz::create(['titre' => 'Le don de sang', 'categorie' => 'Bases', 'statut' => 'actif', 'points_attribues' => 40]);
        for ($i = 1; $i <= 4; $i++) {
            $question = Question::create(['quiz_id' => $this->quiz->id, 'intitule' => "Question {$i}", 'type' => 'unique', 'ordre' => $i]);
            $this->questions[] = [
                'question' => $question,
                'bonne' => Reponse::create(['question_id' => $question->id, 'texte' => 'Vrai', 'est_correcte' => true]),
                'mauvaise' => Reponse::create(['question_id' => $question->id, 'texte' => 'Faux', 'est_correcte' => false]),
            ];
        }
    }

    // ── Liste ───────────────────────────────────────────────────

    public function test_liste_les_quiz_actifs_groupes_par_categorie(): void
    {
        Quiz::create(['titre' => 'Brouillon', 'categorie' => 'Bases', 'statut' => 'brouillon']);

        $this->getJson('/api/quiz')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.categorie', 'Bases')
            ->assertJsonCount(1, '0.quiz')
            ->assertJsonPath('0.quiz.0.nb_questions', 4)
            ->assertJsonPath('0.quiz.0.complete', false)
            ->assertJsonPath('0.quiz.0.score', null);
    }

    public function test_la_liste_montre_le_score_d_un_quiz_termine(): void
    {
        $this->soumettre(3)->assertOk();

        $this->getJson('/api/quiz')
            ->assertJsonPath('0.quiz.0.complete', true)
            ->assertJsonPath('0.quiz.0.score', 3)
            ->assertJsonPath('0.quiz.0.questions_repondues', 4);
    }

    // ── Détail ──────────────────────────────────────────────────

    public function test_le_detail_ne_revele_jamais_les_bonnes_reponses(): void
    {
        $reponse = $this->getJson("/api/quiz/{$this->quiz->id}")->assertOk();

        $reponse->assertJsonCount(4, 'questions');
        $this->assertStringNotContainsString('est_correcte', $reponse->getContent());
    }

    public function test_le_detail_d_un_quiz_inactif_est_introuvable(): void
    {
        $this->quiz->update(['statut' => 'inactif']);

        $this->getJson("/api/quiz/{$this->quiz->id}")->assertNotFound();
    }

    public function test_les_questions_sont_dans_l_ordre_defini(): void
    {
        $this->getJson("/api/quiz/{$this->quiz->id}")
            ->assertJsonPath('questions.0.intitule', 'Question 1')
            ->assertJsonPath('questions.3.intitule', 'Question 4');
    }

    // ── Soumission ──────────────────────────────────────────────

    public function test_un_sans_faute_rapporte_tous_les_points(): void
    {
        $this->soumettre(4)
            ->assertOk()
            ->assertJson(['score' => 4, 'total_questions' => 4, 'points_gagnes' => 40, 'premiere_completion' => true]);

        $this->assertSame(40, $this->user->fresh()->points_cumules);
        $this->assertDatabaseHas('points_historique', ['user_id' => $this->user->id, 'points' => 40, 'source' => 'quiz']);
    }

    public function test_les_points_sont_proportionnels_au_score(): void
    {
        $this->soumettre(3)->assertJson(['score' => 3, 'points_gagnes' => 30]);

        $this->assertSame(30, $this->user->fresh()->points_cumules);
    }

    public function test_zero_bonne_reponse_ne_rapporte_rien_ni_ne_cree_d_historique(): void
    {
        $this->soumettre(0)->assertJson(['score' => 0, 'points_gagnes' => 0]);

        $this->assertDatabaseCount('points_historique', 0);
        $this->assertTrue(UserQuiz::where('user_id', $this->user->id)->sole()->complete);
    }

    public function test_rejouer_un_quiz_ne_rapporte_plus_de_points(): void
    {
        $this->soumettre(2);

        $this->soumettre(4)->assertJson(['points_gagnes' => 0, 'premiere_completion' => false]);

        $this->assertSame(20, $this->user->fresh()->points_cumules);
        $userQuiz = UserQuiz::where('user_id', $this->user->id)->sole();
        $this->assertSame(2, $userQuiz->nb_tentatives);
        $this->assertSame(2, $userQuiz->score);
    }

    public function test_une_question_a_choix_multiple_exige_toutes_les_bonnes_reponses(): void
    {
        $question = Question::create(['quiz_id' => $this->quiz->id, 'intitule' => 'Multiple', 'type' => 'multiple', 'ordre' => 5]);
        $a = Reponse::create(['question_id' => $question->id, 'texte' => 'A', 'est_correcte' => true]);
        $b = Reponse::create(['question_id' => $question->id, 'texte' => 'B', 'est_correcte' => true]);

        $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", ['reponses' => [
            ['question_id' => $question->id, 'reponse_ids' => [$a->id]],
        ]])->assertJsonPath('score', 0);
    }

    public function test_une_question_a_choix_multiple_accepte_les_reponses_dans_le_desordre(): void
    {
        $question = Question::create(['quiz_id' => $this->quiz->id, 'intitule' => 'Multiple', 'type' => 'multiple', 'ordre' => 5]);
        $a = Reponse::create(['question_id' => $question->id, 'texte' => 'A', 'est_correcte' => true]);
        $b = Reponse::create(['question_id' => $question->id, 'texte' => 'B', 'est_correcte' => true]);

        $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", ['reponses' => [
            ['question_id' => $question->id, 'reponse_ids' => [$b->id, $a->id]],
        ]])->assertJsonPath('score', 1);
    }

    public function test_ignore_une_question_d_un_autre_quiz(): void
    {
        $autre = Quiz::create(['titre' => 'Autre', 'statut' => 'actif']);
        $question = Question::create(['quiz_id' => $autre->id, 'intitule' => 'Ailleurs', 'type' => 'unique', 'ordre' => 1]);
        $bonne = Reponse::create(['question_id' => $question->id, 'texte' => 'Oui', 'est_correcte' => true]);

        $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", ['reponses' => [
            ['question_id' => $question->id, 'reponse_ids' => [$bonne->id]],
        ]])->assertJsonPath('score', 0);
    }

    public function test_refuse_une_soumission_sans_reponses(): void
    {
        $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reponses');
    }

    public function test_refuse_de_soumettre_un_quiz_inactif(): void
    {
        $this->quiz->update(['statut' => 'inactif']);

        $this->soumettre(4)->assertNotFound();
        $this->assertSame(0, $this->user->fresh()->points_cumules);
    }

    // ── Progression (reprise d'un quiz en cours) ────────────────

    public function test_sauvegarde_la_progression_et_la_restitue_au_detail(): void
    {
        $q1 = $this->questions[0];

        $this->putJson("/api/quiz/{$this->quiz->id}/progression", ['reponses' => [
            ['question_id' => $q1['question']->id, 'reponse_ids' => [$q1['mauvaise']->id]],
        ]])->assertOk()->assertJson(['enregistree' => true, 'questions_repondues' => 1]);

        $this->getJson("/api/quiz/{$this->quiz->id}")
            ->assertJsonPath('reponses_donnees.0.question_id', $q1['question']->id)
            ->assertJsonPath('reponses_donnees.0.reponse_ids', [$q1['mauvaise']->id]);
        $this->getJson('/api/quiz')->assertJsonPath('0.quiz.0.questions_repondues', 1);
    }

    public function test_la_progression_ignore_les_reponses_etrangeres_a_la_question(): void
    {
        $q1 = $this->questions[0];
        $q2 = $this->questions[1];

        $this->putJson("/api/quiz/{$this->quiz->id}/progression", ['reponses' => [
            ['question_id' => $q1['question']->id, 'reponse_ids' => [$q2['bonne']->id]],
        ]])->assertJson(['questions_repondues' => 0]);
    }

    public function test_la_progression_d_un_quiz_termine_n_est_pas_modifiee(): void
    {
        $this->soumettre(4);
        $q1 = $this->questions[0];

        $this->putJson("/api/quiz/{$this->quiz->id}/progression", ['reponses' => [
            ['question_id' => $q1['question']->id, 'reponse_ids' => [$q1['bonne']->id]],
        ]])->assertJson(['enregistree' => false]);
    }

    public function test_la_soumission_efface_la_progression_en_cours(): void
    {
        $q1 = $this->questions[0];
        $this->putJson("/api/quiz/{$this->quiz->id}/progression", ['reponses' => [
            ['question_id' => $q1['question']->id, 'reponse_ids' => [$q1['bonne']->id]],
        ]]);

        $this->soumettre(4);

        $this->assertNull(UserQuiz::where('user_id', $this->user->id)->sole()->progression);
    }

    /** Soumet le quiz avec `$bonnes` bonnes réponses, le reste en mauvaises. */
    private function soumettre(int $bonnes)
    {
        $reponses = [];
        foreach ($this->questions as $i => $q) {
            $reponses[] = [
                'question_id' => $q['question']->id,
                'reponse_ids' => [$i < $bonnes ? $q['bonne']->id : $q['mauvaise']->id],
            ];
        }

        return $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", ['reponses' => $reponses]);
    }
}
