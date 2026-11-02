<?php

namespace Tests\Feature;

use App\Models\DocumentJuridique;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * 📖 Mass assignment (audit cybersécurité) : User a statut, points_cumules,
 *    doit_changer_mdp... dans $fillable. Les contrôleurs ne passent que les champs validés :
 *    ces tests vérifient qu'un champ ajouté à la requête par un client modifié est ignoré.
 */
class ChampsProtegesApiTest extends TestCase
{
    use RefreshDatabase;

    private const CHAMPS_PROTEGES = [
        'statut' => 'actif',
        'points_cumules' => 999999,
        'doit_changer_mdp' => false,
        'email' => 'pirate@example.test',
        'code_parrainage' => 'PIRATE01',
        'email_verified_at' => '2026-01-01',
    ];

    public function test_put_me_ignore_les_champs_proteges(): void
    {
        Notification::fake();
        $user = User::factory()->create([
            'email' => 'moi@example.test',
            'points_cumules' => 10,
            'doit_changer_mdp' => true,
            'statut' => 'actif',
        ]);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', ['pseudo' => 'NouveauPseudo', ...self::CHAMPS_PROTEGES, 'statut' => 'suspendu'])->assertOk();

        $user->refresh();
        $this->assertSame('NouveauPseudo', $user->pseudo);
        $this->assertSame('moi@example.test', $user->email);
        $this->assertSame(10, $user->points_cumules);
        $this->assertTrue($user->doit_changer_mdp);
        $this->assertSame('actif', $user->statut);
        $this->assertNotSame('PIRATE01', $user->code_parrainage);
    }

    public function test_l_inscription_ignore_les_champs_proteges(): void
    {
        Notification::fake();
        DocumentJuridique::where('type', 'cgu')->update(['version' => '1.0']);

        $this->postJson('/api/auth/register', [
            'pseudo' => 'Goutte',
            'email' => 'goutte@example.test',
            'password' => 'MotDePasse1',
            'password_confirmation' => 'MotDePasse1',
            'sexe' => 'femme',
            'cgu_acceptees' => true,
            'confidentialite_acceptee' => true,
            'consentement_sante' => true,
            'majeur' => true,
            // 📖 Sans code_parrainage : à l'inscription, c'est le code (validé) du parrain.
            ...array_diff_key(self::CHAMPS_PROTEGES, ['code_parrainage' => true]),
            'email' => 'goutte@example.test',
            'cgu_version' => '0.0-falsifiee',
            'role' => 'super_admin',
        ])->assertCreated();

        $user = User::where('email', 'goutte@example.test')->sole();
        $this->assertSame(0, (int) $user->points_cumules);
        $this->assertNull($user->email_verified_at);
        $this->assertNotSame('0.0-falsifiee', $user->cgu_version);
        $this->assertFalse($user->hasAnyRole(['admin', 'super_admin']));
    }
}
