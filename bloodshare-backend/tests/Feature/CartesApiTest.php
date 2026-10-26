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
