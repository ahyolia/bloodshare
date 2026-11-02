<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 📖 Limites de requêtes (audit cybersécurité) : elles ne doivent pas pouvoir être
 *    contournées en changeant X-Forwarded-For, auquel trustProxies('*') fait confiance.
 */
class LimitesRequetesTest extends TestCase
{
    use RefreshDatabase;

    public function test_bloque_la_7e_tentative_sur_un_compte_meme_en_changeant_d_ip(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            $this->tentative('cible@example.test', "203.0.113.{$i}")->assertUnauthorized();
        }

        $this->tentative('cible@example.test', '203.0.113.99')->assertTooManyRequests();
    }

    public function test_la_limite_d_un_compte_ne_bloque_pas_les_autres(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            $this->tentative('cible@example.test', '198.51.100.1');
        }

        $this->tentative('autre@example.test', '198.51.100.1')->assertUnauthorized();
    }

    public function test_la_casse_de_l_email_ne_contourne_pas_la_limite(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            $this->tentative('cible@example.test', "203.0.113.{$i}");
        }

        $this->tentative('  CIBLE@Example.test ', '203.0.113.50')->assertTooManyRequests();
    }

    public function test_limite_l_api_par_utilisateur_connecte_meme_en_changeant_d_ip(): void
    {
        $token = User::factory()->create(['statut' => 'actif'])->createToken('mobile')->plainTextToken;

        for ($i = 1; $i <= 120; $i++) {
            $this->withToken($token)->withHeader('X-Forwarded-For', "203.0.113.{$i}")->getJson('/api/me')->assertOk();
        }

        $this->withToken($token)->withHeader('X-Forwarded-For', '198.51.100.7')->getJson('/api/me')->assertTooManyRequests();
    }

    private function tentative(string $email, string $ip)
    {
        return $this->withHeader('X-Forwarded-For', $ip)
            ->postJson('/api/auth/login', ['email' => $email, 'password' => 'Faux12345']);
    }
}
