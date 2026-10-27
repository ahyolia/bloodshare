<?php

namespace Tests\Feature;

use App\Models\Carte;
use App\Models\Evenement;
use App\Models\User;
use App\Models\UserCarte;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_liste_toutes_les_cartes_evenement_actives_la_generique_en_premier(): void
    {
        // 📖 La migration seed_visuels_cartes_et_badges crée déjà la carte du forum.
        Carte::query()->delete();
        $generique = Carte::create(['titre' => 'Carte Événement', 'categorie' => 'evenement', 'statut' => 'active', 'generique' => true]);
        $forum = Carte::create(['titre' => 'Carte Forum', 'categorie' => 'evenement', 'statut' => 'active']);
        Carte::create(['titre' => 'Ancienne', 'categorie' => 'evenement', 'statut' => 'desactivee']);

        $user = User::factory()->create();
        UserCarte::create(['user_id' => $user->id, 'carte_id' => $forum->id, 'quantite' => 1, 'obtenue_at' => now()]);
        Sanctum::actingAs($user);

        $this->getJson('/api/cartes')
            ->assertOk()
            ->assertJsonCount(2, 'evenement.cartes')
            ->assertJsonPath('evenement.cartes.0.id', $generique->id)
            ->assertJsonPath('evenement.cartes.0.obtenue', false)
            ->assertJsonPath('evenement.cartes.1.id', $forum->id)
            ->assertJsonPath('evenement.cartes.1.obtenue', true)
            ->assertJsonPath('evenement.cartes.1.quantite', 1);
    }

    public function test_une_carte_propre_a_un_evenement_n_apparait_que_si_on_peut_encore_l_obtenir_ou_qu_on_l_a(): void
    {
        Carte::query()->delete();
        Carte::create(['titre' => 'Carte Événement', 'categorie' => 'evenement', 'statut' => 'active', 'generique' => true]);
        $aVenir = Carte::create(['titre' => 'À venir', 'categorie' => 'evenement', 'statut' => 'active']);
        $passeeObtenue = Carte::create(['titre' => 'Passée, obtenue', 'categorie' => 'evenement', 'statut' => 'active']);
        $passee = Carte::create(['titre' => 'Passée', 'categorie' => 'evenement', 'statut' => 'active']);
        $brouillon = Carte::create(['titre' => 'Brouillon', 'categorie' => 'evenement', 'statut' => 'active']);
        Carte::create(['titre' => 'Sans événement', 'categorie' => 'evenement', 'statut' => 'active']);

        $this->creerEvenement($aVenir, now()->addDays(10));
        $this->creerEvenement($passeeObtenue, now()->subDays(10));
        $this->creerEvenement($passee, now()->subDays(10));
        $this->creerEvenement($brouillon, now()->addDays(10), 'brouillon');

        $user = User::factory()->create();
        UserCarte::create(['user_id' => $user->id, 'carte_id' => $passeeObtenue->id, 'quantite' => 1, 'obtenue_at' => now()->subDays(10)]);
        Sanctum::actingAs($user);

        $titres = collect($this->getJson('/api/cartes')->assertOk()->json('evenement.cartes'))->pluck('titre')->all();

        $this->assertSame(['Carte Événement', 'À venir', 'Passée, obtenue'], $titres);
    }

    public function test_une_carte_reste_visible_pendant_l_evenement_jusqu_a_sa_fin(): void
    {
        Carte::query()->delete();
        $forum = Carte::create(['titre' => 'Carte Forum', 'categorie' => 'evenement', 'statut' => 'active']);
        $this->creerEvenement($forum, now()->subHours(2), 'publie', now()->addHour());
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cartes')->assertJsonPath('evenement.cartes.0.id', $forum->id);

        $this->travel(2)->hours();
        $this->getJson('/api/cartes')->assertJsonCount(0, 'evenement.cartes');
    }

    public function test_les_cartes_de_mois_sont_triees_de_janvier_a_decembre(): void
    {
        // 📖 Une carte modifiée (image posée) change de place physique dans PostgreSQL :
        //    on les crée dans le désordre pour ne pas dépendre de l'ordre d'insertion.
        foreach ([10, 1, 12, 2, 11, 3, 9, 4, 8, 5, 7, 6] as $mois) {
            Carte::create(['titre' => "Carte {$mois}", 'categorie' => 'mois_don', 'mois_numero' => $mois, 'statut' => 'active']);
        }
        Sanctum::actingAs(User::factory()->create());

        $mois = collect($this->getJson('/api/cartes')->assertOk()->json('mois_don.cartes'))->pluck('mois_numero')->all();

        $this->assertSame(range(1, 12), $mois);
    }

    public function test_une_collection_par_annee_la_plus_recente_d_abord(): void
    {
        $this->travelTo(now()->setDate(2027, 3, 10));
        $novembre2026 = Carte::create(['titre' => 'Novembre 2026', 'categorie' => 'mois_don', 'mois_numero' => 11, 'annee' => 2026, 'statut' => 'active']);
        Carte::create(['titre' => 'Décembre 2026', 'categorie' => 'mois_don', 'mois_numero' => 12, 'annee' => 2026, 'statut' => 'active']);
        $janvier2027 = Carte::create(['titre' => 'Janvier 2027', 'categorie' => 'mois_don', 'mois_numero' => 1, 'annee' => 2027, 'statut' => 'active']);
        $user = User::factory()->create();
        UserCarte::create(['user_id' => $user->id, 'carte_id' => $novembre2026->id, 'quantite' => 1, 'obtenue_at' => '2026-11-12']);
        UserCarte::create(['user_id' => $user->id, 'carte_id' => $janvier2027->id, 'quantite' => 1, 'obtenue_at' => '2027-01-15']);
        Sanctum::actingAs($user);

        $this->getJson('/api/cartes')
            ->assertOk()
            ->assertJsonPath('mois_don.annee', 2027)
            // Champs de l'année en cours, pour une app pas encore à jour.
            ->assertJsonPath('mois_don.cartes.0.id', $janvier2027->id)
            ->assertJsonPath('mois_don.pourcentage_complete', 8.3)
            ->assertJsonCount(2, 'mois_don.collections')
            ->assertJsonPath('mois_don.collections.0.annee', 2027)
            ->assertJsonPath('mois_don.collections.1.annee', 2026)
            ->assertJsonPath('mois_don.collections.1.cartes.0.id', $novembre2026->id)
            ->assertJsonPath('mois_don.collections.1.cartes.0.annee', 2026)
            ->assertJsonPath('mois_don.collections.1.cartes.0.obtenue', true)
            ->assertJsonPath('mois_don.collections.1.cartes.1.obtenue', false);
    }

    public function test_une_annee_passee_sans_carte_et_une_collection_future_restent_cachees(): void
    {
        $this->travelTo(now()->setDate(2027, 12, 5));
        Carte::create(['titre' => 'Novembre 2026', 'categorie' => 'mois_don', 'mois_numero' => 11, 'annee' => 2026, 'statut' => 'active']);
        Carte::create(['titre' => 'Décembre 2027', 'categorie' => 'mois_don', 'mois_numero' => 12, 'annee' => 2027, 'statut' => 'active']);
        // 📖 Créée en décembre pour que le BO y pose les dessins : pas encore visible.
        Carte::create(['titre' => 'Janvier 2028', 'categorie' => 'mois_don', 'mois_numero' => 1, 'annee' => 2028, 'statut' => 'active']);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cartes')
            ->assertOk()
            ->assertJsonCount(1, 'mois_don.collections')
            ->assertJsonPath('mois_don.collections.0.annee', 2027);
    }

    public function test_renvoie_la_description_et_la_date_d_obtention(): void
    {
        Carte::query()->delete();
        $obtenue = Carte::create([
            'titre' => 'Carte de Novembre',
            'description' => 'Un arbre en feu.',
            'categorie' => 'mois_don',
            'mois_numero' => 11,
            'statut' => 'active',
        ]);
        Carte::create(['titre' => 'Carte de Décembre', 'categorie' => 'mois_don', 'mois_numero' => 12, 'statut' => 'active']);

        $user = User::factory()->create();
        UserCarte::create(['user_id' => $user->id, 'carte_id' => $obtenue->id, 'quantite' => 1, 'obtenue_at' => '2026-11-12 09:30:00']);
        Sanctum::actingAs($user);

        $this->getJson('/api/cartes')
            ->assertOk()
            ->assertJsonPath('mois_don.cartes.0.description', 'Un arbre en feu.')
            ->assertJsonPath('mois_don.cartes.0.obtenue_le', '2026-11-12')
            ->assertJsonPath('mois_don.cartes.0.mois_numero', 11)
            ->assertJsonPath('mois_don.cartes.1.obtenue', false)
            ->assertJsonPath('mois_don.cartes.1.obtenue_le', null);
    }

    public function test_renvoie_la_carte_fidele(): void
    {
        // 📖 Créée par la migration add_carte_fidele.
        $carte = Carte::where('categorie', 'fidele')->sole();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cartes')
            ->assertOk()
            ->assertJsonPath('fidelite.carte.id', $carte->id)
            ->assertJsonPath('fidelite.carte.obtenue', false);
    }

    private function creerEvenement(Carte $carte, $debut, string $statut = 'publie', $fin = null): Evenement
    {
        return Evenement::create([
            'titre' => "Événement {$carte->titre}",
            'lieu' => 'Nouméa',
            'date_heure' => $debut,
            'horaire_fin' => $fin ?? $debut->copy()->addHours(3),
            'statut' => $statut,
            'carte_id' => $carte->id,
        ]);
    }
}
