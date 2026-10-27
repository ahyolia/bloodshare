<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

// 📖 L'app mobile est réservée aux donneurs : un compte du backoffice (admin, super_admin)
//    n'y a rien à faire, et un token mobile sur un compte qui gère l'association n'est
//    qu'une porte d'entrée de plus.
class ComptesBackofficeApiTest extends TestCase
{
    use RefreshDatabase;

    public static function roles(): array
    {
        return ['admin' => ['admin'], 'super_admin' => ['super_admin']];
    }

    #[DataProvider('roles')]
    public function test_un_compte_du_backoffice_ne_peut_pas_se_connecter_a_l_app(string $role): void
    {
        $this->compte($role, 'bo@example.test');

        $this->postJson('/api/auth/login', ['email' => 'bo@example.test', 'password' => 'MotDePasse1'])
            ->assertForbidden()
            ->assertJsonPath('message', fn (string $message) => str_contains($message, 'backoffice'))
            ->assertJsonMissingPath('token');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_un_token_mobile_deja_emis_pour_un_admin_est_refuse(): void
    {
        // Token obtenu avant ce contrôle : il ne doit plus ouvrir l'API.
        $token = $this->compte('admin', 'bo@example.test')->createToken('mobile')->plainTextToken;

        $this->withToken($token)->getJson('/api/me')->assertForbidden();
    }

    public function test_un_donneur_se_connecte_toujours(): void
    {
        User::factory()->create(['email' => 'donneur@example.test', 'password' => Hash::make('MotDePasse1')]);

        $this->postJson('/api/auth/login', ['email' => 'donneur@example.test', 'password' => 'MotDePasse1'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_un_admin_garde_l_acces_au_backoffice(): void
    {
        $this->assertTrue($this->compte('admin', 'bo@example.test')->canAccessPanel(filament()->getPanel('admin')));
    }

    private function compte(string $role, string $email): User
    {
        Role::findOrCreate($role);
        $user = User::factory()->create(['email' => $email, 'password' => Hash::make('MotDePasse1'), 'statut' => 'actif']);
        $user->assignRole($role);

        return $user;
    }
}
