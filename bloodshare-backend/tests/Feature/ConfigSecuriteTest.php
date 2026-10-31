<?php

namespace Tests\Feature;

use Tests\TestCase;

class ConfigSecuriteTest extends TestCase
{
    // ── securite:verifier-config ────────────────────────────────

    public function test_ne_verifie_rien_hors_production(): void
    {
        config(['app.debug' => true]);

        $this->artisan('securite:verifier-config')->assertSuccessful();
    }

    public function test_accepte_une_configuration_de_production_saine(): void
    {
        $this->enProduction();

        $this->artisan('securite:verifier-config')->assertSuccessful();
    }

    public function test_refuse_le_debug_en_production(): void
    {
        $this->enProduction(['app.debug' => true]);

        $this->artisan('securite:verifier-config')
            ->expectsOutputToContain('APP_DEBUG')
            ->assertFailed();
    }

    public function test_refuse_le_mot_de_passe_de_base_de_developpement(): void
    {
        $this->enProduction(['database.connections.pgsql.password' => 'bloodshare123']);

        $this->artisan('securite:verifier-config')
            ->expectsOutputToContain('DB_PASSWORD')
            ->assertFailed();
    }

    public function test_refuse_le_mot_de_passe_du_super_admin_de_developpement(): void
    {
        $this->enProduction(['app.seed_admin_password' => 'Admin-local-1234']);

        $this->artisan('securite:verifier-config')
            ->expectsOutputToContain('SEED_ADMIN_PASSWORD')
            ->assertFailed();
    }

    public function test_refuse_une_app_key_vide(): void
    {
        $this->enProduction(['app.key' => '']);

        $this->artisan('securite:verifier-config')
            ->expectsOutputToContain('APP_KEY')
            ->assertFailed();
    }

    public function test_refuse_un_cookie_de_session_non_securise(): void
    {
        $this->enProduction(['session.secure' => false]);

        $this->artisan('securite:verifier-config')
            ->expectsOutputToContain('SESSION_SECURE_COOKIE')
            ->assertFailed();
    }

    public function test_refuse_toutes_les_origines_cors_en_production(): void
    {
        $this->enProduction(['cors.allowed_origins' => ['*']]);

        $this->artisan('securite:verifier-config')
            ->expectsOutputToContain('CORS_ALLOWED_ORIGINS')
            ->assertFailed();
    }

    public function test_refuse_une_liste_d_origines_cors_contenant_tout(): void
    {
        // Une origine précise ne rattrape pas un « * » oublié dans la liste.
        $this->enProduction(['cors.allowed_origins' => ['https://aima-nc.netlify.app', '*']]);

        $this->artisan('securite:verifier-config')
            ->expectsOutputToContain('CORS_ALLOWED_ORIGINS')
            ->assertFailed();
    }

    // ── En-têtes HTTP ───────────────────────────────────────────

    public function test_ajoute_les_en_tetes_de_securite(): void
    {
        $this->getJson('/api/actualites')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_ajoute_hsts_en_production_en_https(): void
    {
        $this->app['env'] = 'production';

        $this->get('https://localhost/up')
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    private function enProduction(array $config = []): void
    {
        $this->app['env'] = 'production';

        config([
            'app.debug' => false,
            'app.key' => 'base64:' . base64_encode(str_repeat('a', 32)),
            'database.connections.pgsql.password' => 'un-vrai-mot-de-passe',
            'app.seed_admin_password' => null,
            'session.secure' => true,
            'cors.allowed_origins' => ['https://aima-nc.netlify.app'],
            ...$config,
        ]);
    }
}
