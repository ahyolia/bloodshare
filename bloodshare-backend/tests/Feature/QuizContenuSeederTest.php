<?php

namespace Tests\Feature;

use App\Models\Contenu;
use App\Models\Question;
use App\Models\Quiz;
use Database\Seeders\QuizContenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class QuizContenuSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_insere_les_quiz_en_brouillon_dans_les_trois_categories(): void
    {
        $this->seed(QuizContenuSeeder::class);

        $this->assertSame(8, Quiz::count());
        $this->assertSame(40, Question::count());
        $this->assertSame(0, Quiz::where('statut', '!=', 'brouillon')->count());
        $this->assertEqualsCanonicalizing(
            [QuizContenuSeeder::CATEGORIE_ELIGIBILITE, QuizContenuSeeder::CATEGORIE_DON, QuizContenuSeeder::CATEGORIE_CENTRE],
            Quiz::distinct()->pluck('categorie')->all(),
        );
        Notification::assertNothingSent();
    }

    public function test_chaque_question_est_jouable_et_tient_dans_les_limites_du_backoffice(): void
    {
        $this->seed(QuizContenuSeeder::class);

        foreach (Question::with('reponses')->get() as $question) {
            $nbBonnes = $question->reponses->where('est_correcte', true)->count();

            $this->assertGreaterThanOrEqual(1, $nbBonnes, $question->intitule);
            $this->assertTrue($question->reponses->where('est_correcte', false)->isNotEmpty(), $question->intitule);
            // Une question à plusieurs bonnes réponses doit être de type « multiple », sinon
            // l'app ne laisse cocher qu'une case et la question devient impossible à réussir.
            if ($nbBonnes > 1) {
                $this->assertSame('multiple', $question->type, $question->intitule);
            }
            $this->assertLessThanOrEqual(255, mb_strlen($question->intitule), $question->intitule);
            $this->assertNotEmpty($question->explication, $question->intitule);
            $this->assertLessThanOrEqual(1000, mb_strlen($question->explication), $question->intitule);
            foreach ($question->reponses as $reponse) {
                $this->assertLessThanOrEqual(255, mb_strlen($reponse->texte), $reponse->texte);
            }
        }
    }

    public function test_relancer_le_seeder_ne_duplique_ni_n_ecrase_rien(): void
    {
        $this->seed(QuizContenuSeeder::class);
        Quiz::where('titre', 'Le jour du don')->update(['statut' => 'actif']);

        $this->seed(QuizContenuSeeder::class);

        $this->assertSame(8, Quiz::count());
        $this->assertSame('actif', Quiz::where('titre', 'Le jour du don')->value('statut'));
    }

    public function test_relie_une_fiche_publiee_par_son_titre(): void
    {
        $fiche = Contenu::create(['type' => 'fiche_info', 'titre' => 'Les différents groupes sanguins', 'contenu' => '…', 'statut' => 'publie']);

        $this->seed(QuizContenuSeeder::class);

        $this->assertSame(
            $fiche->id,
            Question::where('intitule', 'Combien existe-t-il de groupes sanguins principaux ?')->value('contenu_id'),
        );
    }
}
