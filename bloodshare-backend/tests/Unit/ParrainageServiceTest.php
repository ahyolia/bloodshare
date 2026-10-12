<?php

namespace Tests\Unit;

use App\Models\Badge;
use App\Models\Carte;
use App\Models\Parrainage;
use App\Models\User;
use App\Models\UserCarte;
use App\Notifications\PremierDonFilleulNotification;
use App\Services\ParrainageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ParrainageServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $parrain;
    private User $filleul;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->parrain = User::factory()->create(['points_cumules' => 0]);
        $this->filleul = User::factory()->create(['points_cumules' => 0]);
    }

    public function test_ne_fait_rien_pour_un_utilisateur_sans_parrain(): void
    {
        $this->assertNull($this->valider());

        $this->assertDatabaseCount('points_historique', 0);
    }

    public function test_valide_le_parrainage_en_attente(): void
    {
        $parrainage = $this->creerParrainage();

        $resultat = $this->valider();

        $this->assertSame($parrainage->id, $resultat['parrainage_id']);
        $parrainage->refresh();
        $this->assertSame('valide', $parrainage->statut);
        $this->assertNotNull($parrainage->valide_at);
    }

    public function test_credite_75_points_au_parrain(): void
    {
        $this->creerParrainage();

        $this->valider();

        $this->assertSame(75, $this->parrain->fresh()->points_cumules);
        $this->assertDatabaseHas('points_historique', ['user_id' => $this->parrain->id, 'points' => 75, 'source' => 'parrainage']);
    }

    // 📖 Règle éthique ADSB-NC : un don ne rapporte jamais de points. Le filleul est validé
    //    par son propre premier don, il ne doit donc rien gagner en points.
    public function test_ne_credite_aucun_point_au_filleul_pour_son_premier_don(): void
    {
        $this->creerParrainage();

        $this->valider();

        $this->assertSame(0, $this->filleul->fresh()->points_cumules);
        $this->assertDatabaseMissing('points_historique', ['user_id' => $this->filleul->id]);
    }

    public function test_ne_valide_qu_une_seule_fois(): void
    {
        $this->creerParrainage();

        $this->valider();
        $this->assertNull($this->valider());

        $this->assertSame(75, $this->parrain->fresh()->points_cumules);
    }

    public function test_notifie_le_parrain_du_premier_don_de_son_filleul(): void
    {
        $this->creerParrainage();

        $this->valider();

        Notification::assertSentTo($this->parrain, PremierDonFilleulNotification::class);
    }

    public function test_donne_la_carte_parrain_et_la_carte_filleul(): void
    {
        $carteParrain = Carte::create(['titre' => 'Parrain', 'categorie' => 'parrain', 'statut' => 'active']);
        $carteFilleul = Carte::create(['titre' => 'Filleul', 'categorie' => 'filleul', 'statut' => 'active']);
        $this->creerParrainage();

        $this->valider();

        $this->assertDatabaseHas('user_cartes', ['user_id' => $this->parrain->id, 'carte_id' => $carteParrain->id]);
        $this->assertDatabaseHas('user_cartes', ['user_id' => $this->filleul->id, 'carte_id' => $carteFilleul->id]);
    }

    public function test_un_second_filleul_ne_redonne_pas_la_carte_parrain(): void
    {
        $carteParrain = Carte::create(['titre' => 'Parrain', 'categorie' => 'parrain', 'statut' => 'active']);
        $this->creerParrainage();
        $this->valider();

        $secondFilleul = User::factory()->create();
        Parrainage::create(['parrain_id' => $this->parrain->id, 'filleul_id' => $secondFilleul->id, 'statut' => 'en_attente']);
        app(ParrainageService::class)->validerSiFilleul($secondFilleul);

        $carte = UserCarte::where('user_id', $this->parrain->id)->where('carte_id', $carteParrain->id)->sole();
        $this->assertSame(1, $carte->quantite);
        $this->assertSame(150, $this->parrain->fresh()->points_cumules);
    }

    public function test_n_echoue_pas_si_les_cartes_parrainage_n_existent_pas(): void
    {
        $this->creerParrainage();

        $this->assertNotNull($this->valider());
        $this->assertDatabaseCount('user_cartes', 0);
    }

    public function test_annonce_le_badge_premier_parrainage(): void
    {
        Badge::create([
            'nom' => 'Ambassadeur',
            'condition_type' => 'action_specifique',
            'action_specifique' => 'premier_parrainage',
            'statut' => 'actif',
        ]);
        $this->creerParrainage();

        $resultat = $this->valider();

        $this->assertSame('premier_parrainage', $resultat['badge_debloque']['action_specifique']);
    }

    private function creerParrainage(): Parrainage
    {
        return Parrainage::create([
            'parrain_id' => $this->parrain->id,
            'filleul_id' => $this->filleul->id,
            'statut' => 'en_attente',
        ]);
    }

    private function valider(): ?array
    {
        return app(ParrainageService::class)->validerSiFilleul($this->filleul);
    }
}
