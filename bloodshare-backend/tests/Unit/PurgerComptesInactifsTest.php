<?php

namespace Tests\Unit;

use App\Models\Don;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PurgerComptesInactifsTest extends TestCase
{
    use RefreshDatabase;

    public function test_supprime_un_compte_sans_connexion_depuis_plus_de_3_ans(): void
    {
        $user = User::factory()->create(['sexe' => 'femme', 'derniere_connexion' => now()->subYears(3)->subDay()]);
        Don::create(['user_id' => $user->id, 'date_don' => now()->subYears(4), 'statut' => 'valide']);

        Artisan::call('donnees:purger-comptes-inactifs');

        $user->refresh();
        $this->assertSame('supprime', $user->statut);
        $this->assertNull($user->sexe);
        // Même suppression que DELETE /me : l'historique reste, sans lien avec la personne.
        $this->assertDatabaseHas('dons', ['user_id' => $user->id]);
        $this->assertStringContainsString('1 compte(s) inactif(s) supprimé(s)', Artisan::output());
    }

    public function test_garde_un_compte_actif_depuis_moins_de_3_ans(): void
    {
        $user = User::factory()->create(['derniere_connexion' => now()->subYears(3)->addDay()]);

        Artisan::call('donnees:purger-comptes-inactifs');

        $this->assertNotSame('supprime', $user->fresh()->statut);
    }

    public function test_un_compte_jamais_connecte_compte_a_partir_de_sa_creation(): void
    {
        $ancien = User::factory()->create(['derniere_connexion' => null, 'created_at' => now()->subYears(3)->subDay()]);
        $recent = User::factory()->create(['derniere_connexion' => null, 'created_at' => now()->subYear()]);

        Artisan::call('donnees:purger-comptes-inactifs');

        $this->assertSame('supprime', $ancien->fresh()->statut);
        $this->assertNotSame('supprime', $recent->fresh()->statut);
    }

    public function test_ne_supprime_jamais_un_compte_du_backoffice(): void
    {
        Role::create(['name' => 'admin']);
        $admin = User::factory()->create(['derniere_connexion' => now()->subYears(5)]);
        $admin->assignRole('admin');

        Artisan::call('donnees:purger-comptes-inactifs');

        $this->assertNotSame('supprime', $admin->fresh()->statut);
        $this->assertTrue($admin->fresh()->hasRole('admin'));
    }

    public function test_ne_recompte_pas_un_compte_deja_supprime(): void
    {
        $user = User::factory()->create(['derniere_connexion' => now()->subYears(5)]);
        $user->anonymiser();

        Artisan::call('donnees:purger-comptes-inactifs');

        $this->assertStringContainsString('0 compte(s) inactif(s) supprimé(s)', Artisan::output());
    }
}
