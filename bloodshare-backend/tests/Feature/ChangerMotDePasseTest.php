<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChangerMotDePasseTest extends TestCase
{
    use RefreshDatabase;

    public function test_change_le_mot_de_passe_et_leve_le_flag_doit_changer_mdp(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('AncienMdp123'),
            'doit_changer_mdp' => true,
        ]);
        Sanctum::actingAs($user);

        $reponse = $this->postJson('/api/me/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'AncienMdp123',
            'password' => 'NouveauMdp123',
            'password_confirmation' => 'NouveauMdp123',
        ]);

        $reponse->assertOk();
        $user->refresh();
        $this->assertFalse($user->doit_changer_mdp);
        $this->assertTrue(Hash::check('NouveauMdp123', $user->password));
    }

    public function test_deconnecte_les_autres_appareils_mais_garde_la_session_en_cours(): void
    {
        // 📖 Audit cybersécurité : un token volé restait valable après le changement.
        $user = User::factory()->create(['password' => Hash::make('AncienMdp123')]);
        $autreAppareil = $user->createToken('mobile')->plainTextToken;
        $sessionEnCours = $user->createToken('mobile')->plainTextToken;

        $this->withToken($sessionEnCours)->postJson('/api/me/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'AncienMdp123',
            'password' => 'NouveauMdp123',
            'password_confirmation' => 'NouveauMdp123',
        ])->assertOk();

        $this->assertSame(1, $user->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->withToken($autreAppareil)->getJson('/api/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($sessionEnCours)->getJson('/api/me')->assertOk();
    }

    public function test_refuse_si_le_mot_de_passe_actuel_est_incorrect(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('AncienMdp123'),
        ]);
        Sanctum::actingAs($user);

        $reponse = $this->postJson('/api/me/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'MauvaisMdp123',
            'password' => 'NouveauMdp123',
            'password_confirmation' => 'NouveauMdp123',
        ]);

        $reponse->assertStatus(422);
        $this->assertTrue(Hash::check('AncienMdp123', $user->fresh()->password));
    }

    public function test_refuse_un_nouveau_mot_de_passe_qui_ne_respecte_pas_les_regles(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('AncienMdp123'),
        ]);
        Sanctum::actingAs($user);

        $reponse = $this->postJson('/api/me/changer-mot-de-passe', [
            'mot_de_passe_actuel' => 'AncienMdp123',
            'password' => 'minuscules',
            'password_confirmation' => 'minuscules',
        ]);

        $reponse->assertStatus(422);
    }
}
