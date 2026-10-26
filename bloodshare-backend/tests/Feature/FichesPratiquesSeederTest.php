<?php

namespace Tests\Feature;

use App\Models\Contenu;
use App\Models\Question;
use App\Models\Quiz;
use Database\Seeders\FichesPratiquesSeeder;
use Database\Seeders\QuizContenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class FichesPratiquesSeederTest extends TestCase
{
    use RefreshDatabase;

    /** Catégories proposées dans le BO (ContenuResource) et affichées par l'app. */
    private const CATEGORIES = ['eligibilite', 'processus_don', 'apres_don', 'urgences'];

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_publie_les_fiches_dans_les_categories_de_l_app(): void
    {
        $this->seed(FichesPratiquesSeeder::class);

        $fiches = Contenu::where('type', 'fiche_info')->get();

        $this->assertCount(count(FichesPratiquesSeeder::fiches()), $fiches);
        foreach ($fiches as $fiche) {
            $this->assertContains($fiche->categorie, self::CATEGORIES, $fiche->titre);
            $this->assertSame('publie', $fiche->statut, $fiche->titre);
            // Limites du backoffice (ContenuResource) : la fiche reste modifiable.
            $this->assertLessThanOrEqual(10000, mb_strlen($fiche->contenu), $fiche->titre);
            $this->assertNotEmpty($fiche->le_saviez_vous, $fiche->titre);
        }
    }

    public function test_remplace_une_fiche_de_demo_sans_la_dupliquer(): void
    {
        Contenu::create([
            'type' => 'fiche_info',
            'titre' => 'Qui peut donner son sang ?',
            'contenu' => 'Lorem ipsum : contenu de démonstration.',
            'categorie' => 'eligibilite',
            'statut' => 'publie',
        ]);

        $this->seed(FichesPratiquesSeeder::class);
        $this->seed(FichesPratiquesSeeder::class);

        $fiche = Contenu::where('titre', 'Qui peut donner son sang ?')->sole();
        $this->assertStringNotContainsString('Lorem', $fiche->contenu);
    }

    public function test_garde_une_fiche_modifiee_dans_le_bo_et_ne_remet_que_son_ordre(): void
    {
        $this->seed(FichesPratiquesSeeder::class);
        Contenu::where('titre', 'Qui peut donner son sang ?')->update([
            'contenu' => 'Texte relu par Strat\'Com.',
            'statut' => 'brouillon',
            'published_at' => null,
        ]);

        $this->seed(FichesPratiquesSeeder::class);

        $fiche = Contenu::where('titre', 'Qui peut donner son sang ?')->sole();
        $this->assertSame('Texte relu par Strat\'Com.', $fiche->contenu);
        $this->assertSame('brouillon', $fiche->statut);
        $this->assertNotNull($fiche->published_at);
    }

    public function test_retire_l_ancienne_fiche_de_demo_mais_pas_une_fiche_reecrite(): void
    {
        Contenu::create(['type' => 'fiche_info', 'titre' => 'Les bienfaits du don de sang', 'contenu' => 'Lorem ipsum…', 'statut' => 'publie']);

        $this->seed(FichesPratiquesSeeder::class);
        $this->assertSame('brouillon', Contenu::where('titre', 'Les bienfaits du don de sang')->value('statut'));

        Contenu::where('titre', 'Les bienfaits du don de sang')->update(['contenu' => 'Texte écrit par Strat\'Com.', 'statut' => 'publie']);
        $this->seed(FichesPratiquesSeeder::class);
        $this->assertSame('publie', Contenu::where('titre', 'Les bienfaits du don de sang')->value('statut'));
    }

    public function test_relie_les_questions_des_quiz_deja_en_base(): void
    {
        // Quiz créés avant les fiches : leurs questions n'ont encore aucun lien.
        $this->seed(QuizContenuSeeder::class);
        $this->assertSame(0, Question::whereNotNull('contenu_id')->count());

        $this->seed(FichesPratiquesSeeder::class);

        $voyages = Contenu::where('titre', 'Voyages et zones impaludées')->value('id');
        $this->assertSame(
            $voyages,
            Question::where('intitule', 'like', '%zone impaludée%')->value('contenu_id'),
        );
        // Chaque quiz renvoie vers au moins une fiche.
        foreach (Quiz::with('questions')->get() as $quiz) {
            $this->assertTrue($quiz->questions->whereNotNull('contenu_id')->isNotEmpty(), $quiz->titre);
        }
    }

    public function test_chaque_fiche_prevue_dans_les_quiz_existe(): void
    {
        $titres = array_column(FichesPratiquesSeeder::fiches(), 'titre');

        foreach (QuizContenuSeeder::quiz() as $quiz) {
            foreach ($quiz['questions'] as $question) {
                if (isset($question['fiche'])) {
                    $this->assertContains($question['fiche'], $titres, $question['intitule']);
                }
            }
        }
    }
}
