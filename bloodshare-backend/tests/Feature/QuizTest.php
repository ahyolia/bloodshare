<?php

namespace Tests\Feature;

use App\Models\Contenu;
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

    public function test_une_question_renvoyee_plusieurs_fois_ne_compte_qu_une_fois(): void
    {
        // 📖 Audit cybersécurité : chaque copie d'une même bonne réponse comptait un point de
        //    score, et les points dépassaient le maximum du quiz.
        $q = $this->questions[0];
        $copies = array_fill(0, 100, ['question_id' => $q['question']->id, 'reponse_ids' => [$q['bonne']->id]]);

        $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", ['reponses' => $copies])
            ->assertOk()
            ->assertJson(['score' => 1, 'points_gagnes' => 10]);

        $this->assertSame(10, $this->user->fresh()->points_cumules);
    }

    public function test_une_question_deguisee_en_autre_identifiant_ne_compte_qu_une_fois(): void
    {
        // 📖 Revue de la PR #120 : « +1 » passe la validation et était rangé à part de 1 par
        //    keyBy, alors que la comparaison souple retrouvait la même question : la bonne
        //    réponse comptait deux fois.
        $q = $this->questions[0];
        $id = $q['question']->id;

        $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", ['reponses' => [
            ['question_id' => $id, 'reponse_ids' => [$q['bonne']->id]],
            ['question_id' => "+{$id}", 'reponse_ids' => [$q['bonne']->id]],
        ]])
            ->assertOk()
            ->assertJson(['score' => 1, 'points_gagnes' => 10]);

        $this->assertSame(10, $this->user->fresh()->points_cumules);
    }

    public function test_refuse_un_identifiant_de_question_qui_n_est_pas_un_entier(): void
    {
        // 📖 « 1.0 » arrivait jusqu'à la règle exists, et PostgreSQL le rejetait : erreur 500.
        $q = $this->questions[0];

        foreach (["{$q['question']->id}.0", "0{$q['question']->id}", 'abc'] as $questionId) {
            $this->postJson("/api/quiz/{$this->quiz->id}/soumettre", ['reponses' => [
                ['question_id' => $questionId, 'reponse_ids' => [$q['bonne']->id]],
            ]])->assertUnprocessable()->assertJsonValidationErrors('reponses.0.question_id');
        }
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

    // ── Correction question par question (US-30) ────────────────

    public function test_verifier_corrige_une_bonne_reponse_avec_explication_et_fiche(): void
    {
        $fiche = Contenu::create(['type' => 'fiche_info', 'titre' => 'Le paludisme', 'contenu' => '…', 'statut' => 'publie']);
        $q1 = $this->questions[0];
        $q1['question']->update(['explication' => 'Parce que.', 'contenu_id' => $fiche->id]);

        $this->verifier($q1['question'], [$q1['bonne']->id])
            ->assertOk()
            ->assertJson([
                'question_id' => $q1['question']->id,
                'correcte' => true,
                'reponse_ids' => [$q1['bonne']->id],
                'reponses_correctes' => [$q1['bonne']->id],
                'explication' => 'Parce que.',
                'contenu' => ['id' => $fiche->id, 'titre' => 'Le paludisme'],
            ]);
    }

    public function test_verifier_corrige_une_mauvaise_reponse_et_montre_la_bonne(): void
    {
        $q1 = $this->questions[0];

        $this->verifier($q1['question'], [$q1['mauvaise']->id])
            ->assertOk()
            ->assertJson([
                'correcte' => false,
                'reponses_correctes' => [$q1['bonne']->id],
                'explication' => null,
                'contenu' => null,
            ]);
    }

    public function test_verifier_une_question_multiple_exige_toutes_les_bonnes_reponses(): void
    {
        $question = Question::create(['quiz_id' => $this->quiz->id, 'intitule' => 'Multiple', 'type' => 'multiple', 'ordre' => 5]);
        $a = Reponse::create(['question_id' => $question->id, 'texte' => 'A', 'est_correcte' => true]);
        $b = Reponse::create(['question_id' => $question->id, 'texte' => 'B', 'est_correcte' => true]);

        $this->verifier($question, [$a->id])->assertJson(['correcte' => false]);
    }

    public function test_verifier_accepte_une_question_multiple_dans_le_desordre(): void
    {
        $question = Question::create(['quiz_id' => $this->quiz->id, 'intitule' => 'Multiple', 'type' => 'multiple', 'ordre' => 5]);
        $a = Reponse::create(['question_id' => $question->id, 'texte' => 'A', 'est_correcte' => true]);
        $b = Reponse::create(['question_id' => $question->id, 'texte' => 'B', 'est_correcte' => true]);

        $this->verifier($question, [$b->id, $a->id])->assertJson(['correcte' => true]);
    }

    public function test_une_question_verifiee_ne_peut_pas_changer_de_reponse(): void
    {
        $q1 = $this->questions[0];
        $this->verifier($q1['question'], [$q1['mauvaise']->id]);

        $this->verifier($q1['question'], [$q1['bonne']->id])
            ->assertOk()
            ->assertJson(['correcte' => false, 'reponse_ids' => [$q1['mauvaise']->id]]);
    }

    public function test_la_soumission_compte_la_reponse_verrouillee_et_non_celle_envoyee(): void
    {
        // 📖 Sinon : valider une mauvaise réponse, lire la correction, soumettre la bonne.
        $q1 = $this->questions[0];
        $this->verifier($q1['question'], [$q1['mauvaise']->id]);

        $this->soumettre(4)->assertJson(['score' => 3, 'points_gagnes' => 30]);
    }

    public function test_la_progression_ne_remplace_pas_une_reponse_verrouillee(): void
    {
        $q1 = $this->questions[0];
        $this->verifier($q1['question'], [$q1['mauvaise']->id]);

        $this->putJson("/api/quiz/{$this->quiz->id}/progression", ['reponses' => [
            ['question_id' => $q1['question']->id, 'reponse_ids' => [$q1['bonne']->id]],
        ]])->assertOk();

        $this->assertSame(
            [$q1['question']->id => [$q1['mauvaise']->id]],
            UserQuiz::where('user_id', $this->user->id)->sole()->progression,
        );
    }

    public function test_le_detail_restitue_la_correction_des_questions_deja_verifiees(): void
    {
        $q1 = $this->questions[0];
        $this->verifier($q1['question'], [$q1['mauvaise']->id]);

        $this->getJson("/api/quiz/{$this->quiz->id}")
            ->assertJsonPath('reponses_donnees.0.question_id', $q1['question']->id)
            ->assertJsonPath('reponses_donnees.0.correction.correcte', false)
            ->assertJsonPath('reponses_donnees.0.correction.reponses_correctes', [$q1['bonne']->id]);
    }

    public function test_verifier_un_quiz_termine_corrige_sans_verrouiller(): void
    {
        $this->soumettre(0);
        $q1 = $this->questions[0];

        $this->verifier($q1['question'], [$q1['mauvaise']->id])->assertJson(['correcte' => false]);
        $this->verifier($q1['question'], [$q1['bonne']->id])->assertJson(['correcte' => true]);

        $this->assertNull(UserQuiz::where('user_id', $this->user->id)->sole()->progression);
    }

    public function test_verifier_refuse_une_question_d_un_autre_quiz(): void
    {
        $autre = Quiz::create(['titre' => 'Autre', 'statut' => 'actif']);
        $question = Question::create(['quiz_id' => $autre->id, 'intitule' => 'Ailleurs', 'type' => 'unique', 'ordre' => 1]);
        $bonne = Reponse::create(['question_id' => $question->id, 'texte' => 'Oui', 'est_correcte' => true]);

        $this->postJson("/api/quiz/{$this->quiz->id}/questions/{$question->id}/verifier", ['reponse_ids' => [$bonne->id]])
            ->assertNotFound();
    }

    public function test_verifier_refuse_des_reponses_etrangeres_a_la_question(): void
    {
        $q1 = $this->questions[0];
        $q2 = $this->questions[1];

        $this->verifier($q1['question'], [$q2['bonne']->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reponse_ids');
        $this->assertDatabaseCount('user_quiz', 0);
    }

    public function test_verifier_refuse_une_reponse_vide(): void
    {
        $this->verifier($this->questions[0]['question'], [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reponse_ids');
    }

    public function test_verifier_un_quiz_inactif_est_introuvable(): void
    {
        $this->quiz->update(['statut' => 'inactif']);
        $q1 = $this->questions[0];

        $this->verifier($q1['question'], [$q1['bonne']->id])->assertNotFound();
    }

    public function test_une_fiche_non_publiee_n_est_pas_proposee(): void
    {
        $brouillon = Contenu::create(['type' => 'fiche_info', 'titre' => 'Brouillon', 'contenu' => '…', 'statut' => 'brouillon']);
        $q1 = $this->questions[0];
        $q1['question']->update(['contenu_id' => $brouillon->id]);

        $this->verifier($q1['question'], [$q1['bonne']->id])->assertJson(['contenu' => null]);
    }

    public function test_la_soumission_renvoie_la_correction_de_chaque_question(): void
    {
        $q1 = $this->questions[0];
        $q1['question']->update(['explication' => 'Parce que.']);

        $this->soumettre(3)
            ->assertJsonCount(4, 'details')
            ->assertJsonPath('details.0.question_id', $q1['question']->id)
            ->assertJsonPath('details.0.correcte', true)
            ->assertJsonPath('details.0.reponse_ids', [$q1['bonne']->id])
            ->assertJsonPath('details.0.explication', 'Parce que.')
            ->assertJsonPath('details.3.correcte', false)
            ->assertJsonPath('details.3.reponses_correctes', [$this->questions[3]['bonne']->id]);
    }

    public function test_le_detail_ne_revele_pas_les_bonnes_reponses_des_questions_non_verifiees(): void
    {
        $q1 = $this->questions[0];
        $this->verifier($q1['question'], [$q1['bonne']->id]);

        $contenu = $this->getJson("/api/quiz/{$this->quiz->id}")->getContent();

        $this->assertStringNotContainsString('est_correcte', $contenu);
        $this->assertSame(1, substr_count($contenu, 'reponses_correctes'));
    }

    /** Valide une question avec les réponses données. */
    private function verifier(Question $question, array $reponseIds)
    {
        return $this->postJson("/api/quiz/{$this->quiz->id}/questions/{$question->id}/verifier", ['reponse_ids' => $reponseIds]);
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
