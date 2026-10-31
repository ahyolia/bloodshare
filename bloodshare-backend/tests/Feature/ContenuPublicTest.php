<?php

namespace Tests\Feature;

use App\Models\Banniere;
use App\Models\Contenu;
use App\Models\Evenement;
use App\Models\QuestionEligibilite;
use App\Models\Quiz;
use App\Models\StockSang;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// 📖 Ces routes sont publiques : aucun test ici ne se connecte.
class ContenuPublicTest extends TestCase
{
    use RefreshDatabase;

    public function test_liste_les_actualites_publiees_de_la_plus_recente_a_la_plus_ancienne(): void
    {
        Contenu::create(['type' => 'actualite', 'titre' => 'Ancienne', 'contenu' => 'Texte', 'statut' => 'publie', 'published_at' => now()->subWeek()]);
        Contenu::create(['type' => 'actualite', 'titre' => 'Récente', 'contenu' => 'Corps', 'statut' => 'publie', 'published_at' => now()]);
        Contenu::create(['type' => 'actualite', 'titre' => 'Brouillon', 'contenu' => 'X', 'statut' => 'brouillon']);
        Contenu::create(['type' => 'fiche_info', 'titre' => 'Fiche', 'contenu' => 'X', 'statut' => 'publie']);

        $this->getJson('/api/actualites')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.titre', 'Récente')
            ->assertJsonPath('0.contenu', 'Corps');
    }

    public function test_liste_les_fiches_infos_publiees(): void
    {
        Contenu::create(['type' => 'fiche_info', 'titre' => 'Qui peut donner ?', 'contenu' => 'X', 'categorie' => 'Bases', 'statut' => 'publie', 'published_at' => now(), 'quiz_cta' => true]);
        Contenu::create(['type' => 'fiche_info', 'titre' => 'Brouillon', 'contenu' => 'X', 'statut' => 'brouillon']);

        $this->getJson('/api/fiches-infos')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.titre', 'Qui peut donner ?')
            ->assertJsonPath('0.quiz_cta', true)
            ->assertJsonPath('0.quiz_lies', []);
    }

    public function test_donne_les_quiz_actifs_dont_une_question_renvoie_vers_la_fiche(): void
    {
        $fiche = Contenu::create(['type' => 'fiche_info', 'titre' => 'Groupes', 'contenu' => 'X', 'statut' => 'publie', 'published_at' => now()]);
        $actif = Quiz::create(['titre' => 'Le parcours de ton sang', 'statut' => 'actif', 'points_attribues' => 20]);
        $brouillon = Quiz::create(['titre' => 'Pas encore relu', 'statut' => 'brouillon', 'points_attribues' => 20]);
        // Deux questions du même quiz vers la fiche : le quiz n'apparaît qu'une fois.
        foreach ([$actif, $actif, $brouillon] as $i => $quiz) {
            $quiz->questions()->create(['intitule' => "Question {$i}", 'type' => 'unique', 'ordre' => $i, 'contenu_id' => $fiche->id]);
        }

        $this->getJson('/api/fiches-infos')
            ->assertOk()
            ->assertJsonPath('0.quiz_lies', [['id' => $actif->id, 'titre' => 'Le parcours de ton sang']]);
    }

    public function test_renvoie_le_niveau_de_stock_par_groupe_sanguin(): void
    {
        StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
        StockSang::create(['groupe_sanguin' => 'A+', 'niveau' => 'bon']);

        $this->getJson('/api/stock-sang')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
    }

    public function test_liste_uniquement_les_evenements_publies_a_venir(): void
    {
        Evenement::create(['titre' => 'Bientôt', 'lieu' => 'Nouméa', 'date_heure' => now()->addDays(2), 'statut' => 'publie']);
        Evenement::create(['titre' => 'Demain', 'lieu' => 'Nouméa', 'date_heure' => now()->addDay(), 'statut' => 'publie']);
        Evenement::create(['titre' => 'Passé', 'lieu' => 'Nouméa', 'date_heure' => now()->subDay(), 'statut' => 'publie']);
        Evenement::create(['titre' => 'Annulé', 'lieu' => 'Nouméa', 'date_heure' => now()->addDay(), 'statut' => 'annule']);

        $this->getJson('/api/evenements')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.titre', 'Demain')
            ->assertJsonPath('1.titre', 'Bientôt');
    }

    public function test_liste_les_questions_d_eligibilite_actives_dans_l_ordre(): void
    {
        QuestionEligibilite::create(['ordre' => 2, 'question' => 'Deuxième ?', 'reponse_bloquante' => 'oui', 'actif' => true]);
        QuestionEligibilite::create(['ordre' => 1, 'question' => 'Première ?', 'reponse_bloquante' => 'oui', 'actif' => true]);
        QuestionEligibilite::create(['ordre' => 3, 'question' => 'Retirée ?', 'reponse_bloquante' => 'oui', 'actif' => false]);

        $this->getJson('/api/eligibilite')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.question', 'Première ?')
            ->assertJsonPath('1.question', 'Deuxième ?');
    }

    public function test_renvoie_la_derniere_banniere_active(): void
    {
        Banniere::create(['titre' => 'Inactive', 'message' => 'X', 'type' => 'info', 'active' => false]);
        Banniere::create(['titre' => 'Urgence O-', 'message' => 'Venez donner', 'type' => 'urgence', 'active' => true]);

        $this->getJson('/api/bannieres')
            ->assertOk()
            ->assertExactJson(['active' => true, 'type' => 'urgence', 'titre' => 'Urgence O-', 'message' => 'Venez donner']);
    }

    public function test_indique_l_absence_de_banniere_active(): void
    {
        Banniere::create(['titre' => 'Inactive', 'message' => 'X', 'active' => false]);

        $this->getJson('/api/bannieres')->assertExactJson(['active' => false]);
    }

    public function test_annonce_d_elle_meme_les_stocks_critiques_sans_banniere_active(): void
    {
        Banniere::create(['titre' => 'Inactive', 'message' => 'X', 'active' => false]);
        StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
        StockSang::create(['groupe_sanguin' => 'A+', 'niveau' => 'bon']);
        StockSang::create(['groupe_sanguin' => 'O+', 'niveau' => 'critique']);
        StockSang::create(['groupe_sanguin' => 'B-', 'niveau' => 'critique']);

        $this->getJson('/api/bannieres')
            ->assertOk()
            ->assertExactJson([
                'active' => true,
                'type' => 'urgence',
                'titre' => 'Stock critique',
                'message' => 'Les réserves de B-, O+ et O- sont au plus bas. Ton don peut tout changer.',
            ]);
    }

    public function test_annonce_un_seul_groupe_critique(): void
    {
        StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);

        $this->getJson('/api/bannieres')
            ->assertJsonPath('message', 'Les réserves de O- sont au plus bas. Ton don peut tout changer.');
    }

    public function test_la_banniere_du_backoffice_l_emporte_sur_l_alerte_des_stocks(): void
    {
        StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
        Banniere::create(['titre' => 'Collecte ce week-end', 'message' => 'Place des Cocotiers', 'type' => 'info', 'active' => true]);

        $this->getJson('/api/bannieres')
            ->assertExactJson(['active' => true, 'type' => 'info', 'titre' => 'Collecte ce week-end', 'message' => 'Place des Cocotiers']);
    }

    public function test_aucune_banniere_quand_aucun_stock_n_est_critique(): void
    {
        StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'bas']);
        StockSang::create(['groupe_sanguin' => 'A+', 'niveau' => 'bon']);

        $this->getJson('/api/bannieres')->assertExactJson(['active' => false]);
    }
}
