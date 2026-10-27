<?php

namespace Tests\Feature;

use App\Models\Carte;
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
}
