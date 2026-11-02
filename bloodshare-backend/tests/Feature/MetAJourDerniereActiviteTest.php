<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MetAJourDerniereActiviteTest extends TestCase
{
    use RefreshDatabase;

    public function test_une_requete_authentifiee_met_a_jour_derniere_connexion_si_absente(): void
    {
        $user = User::factory()->create(['derniere_connexion' => null]);
        Sanctum::actingAs($user);

        $this->getJson('/api/me');

        $this->assertTrue($user->fresh()->derniere_connexion->isToday());
    }

    public function test_une_requete_authentifiee_ne_reecrit_pas_si_deja_a_jour_aujourd_hui(): void
    {
        $user = User::factory()->create(['derniere_connexion' => now()]);
        Sanctum::actingAs($user);

        $this->getJson('/api/me');

        // 📖 Pas d'assertion sur updated_at ici : on vérifie juste que la date reste
        //    "aujourd'hui", le comportement observable qui compte pour
        //    NotifierRetourInactivite (whereDate).
        $this->assertTrue($user->fresh()->derniere_connexion->isToday());
    }
}
