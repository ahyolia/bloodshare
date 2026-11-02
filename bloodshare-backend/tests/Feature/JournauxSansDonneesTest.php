<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * 📖 Audit cybersécurité : une erreur SQL sur la table users écrivait l'email, le mot de
 *    passe haché et toute la ligne (sexe compris) dans laravel.log.
 */
class JournauxSansDonneesTest extends TestCase
{
    use RefreshDatabase;

    private string $journal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->journal = sys_get_temp_dir() . '/journal-test-' . uniqid() . '.log';
        config([
            'logging.default' => 'test',
            'logging.channels.test' => ['driver' => 'single', 'path' => $this->journal, 'level' => 'debug'],
        ]);
    }

    protected function tearDown(): void
    {
        @unlink($this->journal);

        parent::tearDown();
    }

    public function test_une_erreur_sql_sur_un_compte_ne_journalise_ni_email_ni_hash_ni_ligne(): void
    {
        User::factory()->create(['email' => 'goutte@example.test']);
        $hash = Hash::make('MotDePasse1');

        try {
            // Doublon d'email : même erreur que celles trouvées dans le laravel.log local.
            User::query()->insert(['pseudo' => 'Doublon', 'email' => 'goutte@example.test', 'password' => $hash, 'sexe' => 'femme']);
            $this->fail('La contrainte unique aurait dû échouer.');
        } catch (QueryException $e) {
            report($e);
        }

        $contenu = file_get_contents($this->journal);

        $this->assertStringContainsString('users_email_unique', $contenu, 'Le journal doit rester utile pour déboguer.');
        $this->assertStringNotContainsString('goutte@example.test', $contenu);
        $this->assertStringNotContainsString($hash, $contenu);
        $this->assertStringNotContainsString('femme', $contenu);
        $this->assertStringNotContainsString('DETAIL', $contenu);
    }
}
