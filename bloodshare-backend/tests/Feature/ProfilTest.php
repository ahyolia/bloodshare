<?php

namespace Tests\Feature;

use App\Models\Avatar;
use App\Models\Don;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

// 📖 Le changement de mot de passe a son propre fichier (ChangerMotDePasseTest).
class ProfilTest extends TestCase
{
    use RefreshDatabase;

    public function test_affiche_le_profil_avec_le_niveau_calcule(): void
    {
        $user = User::factory()->create(['pseudo' => 'Goutte', 'points_cumules' => 150]);
        Sanctum::actingAs($user);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('pseudo', 'Goutte')
            ->assertJsonPath('niveau.niveau', 2)
            ->assertJsonPath('niveau.label', 'Informé');
    }

    public function test_le_profil_n_expose_ni_email_ni_mot_de_passe(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $reponse = $this->getJson('/api/me')->assertOk();

        $reponse->assertJsonMissingPath('email')->assertJsonMissingPath('password');
    }

    // Profil de donneur retiré (minimisation des données de santé) : il ne doit
    // plus être ni renvoyé ni enregistré, même si un ancien client l'envoie encore.
    public function test_le_profil_de_donneur_n_est_plus_ni_expose_ni_enregistre(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->putJson('/api/me', ['statut_donneur' => 'donneur_regulier'])
            ->assertOk()
            ->assertJsonMissingPath('statut_donneur');

        $this->getJson('/api/me')->assertOk()->assertJsonMissingPath('statut_donneur');
        $this->assertFalse(\Illuminate\Support\Facades\Schema::hasColumn('users', 'statut_donneur'));
    }

    public function test_genere_un_code_de_parrainage_s_il_manque(): void
    {
        $user = User::factory()->create(['code_parrainage' => null]);
        Sanctum::actingAs($user);

        $code = $this->getJson('/api/me')->json('code_parrainage');

        $this->assertMatchesRegularExpression('/^[A-Z0-9]{8}$/', $code);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'code_parrainage' => $code]);
    }

    public function test_modifie_le_pseudo_et_l_avatar(): void
    {
        $user = User::factory()->create(['pseudo' => 'Ancien']);
        $avatar = Avatar::create(['nom' => 'Goutte', 'image_url' => 'avatars/goutte.png']);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', ['pseudo' => 'Nouveau', 'avatar_id' => $avatar->id])
            ->assertOk()
            ->assertJsonPath('pseudo', 'Nouveau');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'pseudo' => 'Nouveau', 'avatar_id' => $avatar->id]);
    }

    // L'app déduit l'emoji de l'avatar de `avatar_id` : sans lui dans la réponse,
    // le choix est bien enregistré mais l'écran retombe sur l'initiale du pseudo.
    public function test_renvoie_l_avatar_choisi_apres_modification_et_a_la_lecture(): void
    {
        $user = User::factory()->create();
        $avatar = Avatar::create(['nom' => 'Lune', 'image_url' => null]);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', ['avatar_id' => $avatar->id])
            ->assertOk()
            ->assertJsonPath('avatar_id', $avatar->id);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('avatar_id', $avatar->id);
    }

    public function test_un_champ_absent_n_efface_pas_la_valeur_existante(): void
    {
        $user = User::factory()->create(['pseudo' => 'Garde']);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', [])->assertOk()->assertJsonPath('pseudo', 'Garde');
    }

    public function test_garder_son_propre_pseudo_n_est_pas_un_doublon(): void
    {
        $user = User::factory()->create(['pseudo' => 'Goutte']);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', ['pseudo' => 'Goutte'])->assertOk();
    }

    public function test_refuse_le_pseudo_d_un_autre_utilisateur(): void
    {
        User::factory()->create(['pseudo' => 'Pris']);
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/me', ['pseudo' => 'Pris'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pseudo');
    }

    public function test_refuse_un_avatar_inexistant(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/me', ['avatar_id' => 9999])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('avatar_id');
    }

    // ── Suppression du compte (RGPD) ────────────────────────────

    public function test_la_suppression_anonymise_le_compte(): void
    {
        $user = User::factory()->create(['pseudo' => 'Goutte', 'email' => 'goutte@example.test']);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/me')->assertOk();

        $user->refresh();
        $this->assertSame('supprime', $user->statut);
        $this->assertSame('Utilisateur supprimé', $user->pseudo);
        $this->assertSame("supprime-{$user->id}@bloodshare.local", $user->email);
        $this->assertNull($user->code_parrainage);
        $this->assertFalse(Hash::check('password', $user->password));
    }

    public function test_la_suppression_detache_les_donnees_de_sante_et_de_profil(): void
    {
        $user = User::factory()->create([
            'sexe' => 'femme',
            'derniere_connexion' => now(),
            'motif_suspension' => 'Pseudo injurieux',
        ]);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/me')->assertOk();

        $user->refresh();
        $this->assertNull($user->sexe);
        $this->assertNull($user->derniere_connexion);
        $this->assertNull($user->motif_suspension);
    }

    public function test_un_admin_supprime_perd_ses_roles_et_son_remember_token(): void
    {
        Role::create(['name' => 'admin']);
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $admin->anonymiser();

        $admin->refresh();
        $this->assertNull($admin->remember_token);
        $this->assertSame(0, $admin->roles()->count());
    }

    public function test_la_suppression_efface_l_historique_des_notifications(): void
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => 'test',
            'data' => ['message' => 'Tu peux de nouveau donner'],
        ]);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/me')->assertOk();

        $this->assertSame(0, $user->notifications()->count());
    }

    public function test_la_suppression_conserve_l_historique_des_dons(): void
    {
        $user = User::factory()->create();
        Don::create(['user_id' => $user->id, 'date_don' => now(), 'statut' => 'valide']);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/me')->assertOk();

        $this->assertDatabaseHas('dons', ['user_id' => $user->id]);
    }

    public function test_la_suppression_revoque_tous_les_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('telephone');
        $token = $user->createToken('mobile')->plainTextToken;

        $this->withToken($token)->deleteJson('/api/me')->assertOk();

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_un_compte_supprime_ne_regenere_pas_de_code_de_parrainage(): void
    {
        $user = User::factory()->create();
        $user->anonymiser();

        $this->assertNull($user->fresh()->code_parrainage);
    }
}
