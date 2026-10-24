<?php

namespace Tests\Feature;

use App\Filament\Resources\UserResource\Pages\ViewUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Livewire\Livewire;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SuspensionCompteTest extends TestCase
{
    use RefreshDatabase;

    // ── API ─────────────────────────────────────────────────────

    public function test_un_compte_suspendu_ne_peut_plus_se_connecter(): void
    {
        User::factory()->create([
            'email' => 'goutte@example.test',
            'password' => Hash::make('MotDePasse1'),
            'statut' => 'suspendu',
        ]);

        $this->postJson('/api/auth/login', ['email' => 'goutte@example.test', 'password' => 'MotDePasse1'])
            ->assertForbidden()
            ->assertJsonMissingPath('token');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_suspendre_revoque_les_tokens_du_compte(): void
    {
        $user = User::factory()->create(['statut' => 'actif']);
        $token = $user->createToken('mobile')->plainTextToken;

        $user->suspendre('Comportement abusif');

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
        $this->assertSame('Comportement abusif', $user->fresh()->motif_suspension);
    }

    public function test_un_token_reste_refuse_si_le_compte_est_suspendu_sans_revocation(): void
    {
        // 📖 Statut changé directement, sans passer par suspendre() : seul le middleware
        //    protège encore l'API.
        $user = User::factory()->create(['statut' => 'suspendu']);
        Sanctum::actingAs($user);

        $this->getJson('/api/me')->assertForbidden();
        $this->getJson('/api/dons')->assertForbidden();
    }

    public function test_un_compte_actif_garde_l_acces_a_l_api(): void
    {
        Sanctum::actingAs(User::factory()->create(['statut' => 'actif']));

        $this->getJson('/api/me')->assertOk();
    }

    // ── Backoffice ──────────────────────────────────────────────

    public function test_un_admin_suspendu_n_a_plus_acces_au_backoffice(): void
    {
        $admin = $this->admin(['statut' => 'suspendu']);

        $this->actingAs($admin)->get('/admin')->assertForbidden();
    }

    public function test_un_admin_actif_accede_au_backoffice(): void
    {
        $this->actingAs($this->admin())->get('/admin')->assertOk();
    }

    public function test_l_action_suspendre_du_bo_revoque_les_tokens(): void
    {
        $user = User::factory()->create(['statut' => 'actif']);
        $user->createToken('mobile');

        $this->actingAs($this->admin());

        Livewire::test(ViewUser::class, ['record' => $user->getRouteKey()])
            ->callAction('suspendre', ['motif' => 'Comportement abusif'])
            ->assertHasNoActionErrors();

        $this->assertSame('suspendu', $user->fresh()->statut);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    private function admin(array $attributs = []): User
    {
        Role::findOrCreate('admin');

        $admin = User::factory()->create(['statut' => 'actif', ...$attributs]);
        $admin->assignRole('admin');

        return $admin;
    }
}
