<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\DocumentJuridique;
use App\Models\User;
use App\Notifications\FilleulInscritNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    // ── Inscription ─────────────────────────────────────────────

    public function test_inscrit_un_utilisateur_et_renvoie_un_token(): void
    {
        $reponse = $this->postJson('/api/auth/register', $this->inscription());

        $reponse->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'pseudo', 'code_parrainage']])
            ->assertJsonPath('user.pseudo', 'Goutte');
        $this->assertMatchesRegularExpression('/^[A-Z0-9]{8}$/', $reponse->json('user.code_parrainage'));
        $this->assertDatabaseHas('users', ['email' => 'goutte@example.test', 'sexe' => 'femme']);
    }

    public function test_enregistre_la_preuve_des_consentements(): void
    {
        // 📖 La version enregistrée est celle du document modifié dans le BO.
        DocumentJuridique::where('type', 'cgu')->update(['version' => '2.0']);

        $this->postJson('/api/auth/register', $this->inscription())->assertCreated();

        $user = User::where('email', 'goutte@example.test')->first();
        $this->assertSame('2.0', $user->cgu_version);
        $this->assertNotNull($user->cgu_acceptees_at);
        $this->assertNotNull($user->consentement_sante_at);
    }

    #[DataProvider('consentementsObligatoires')]
    public function test_refuse_une_inscription_sans_consentement(string $champ, mixed $valeur): void
    {
        $this->postJson('/api/auth/register', $this->inscription([$champ => $valeur]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors($champ);

        $this->assertDatabaseCount('users', 0);
    }

    public static function consentementsObligatoires(): array
    {
        return [
            'CGU refusées' => ['cgu_acceptees', false],
            'confidentialité absente' => ['confidentialite_acceptee', null],
            'données de santé refusées' => ['consentement_sante', false],
            'majorité non certifiée' => ['majeur', false],
        ];
    }

    public function test_ne_stocke_pas_le_mot_de_passe_en_clair(): void
    {
        $this->postJson('/api/auth/register', $this->inscription())->assertCreated();

        $user = User::where('email', 'goutte@example.test')->first();
        $this->assertNotSame('MotDePasse1', $user->password);
        $this->assertTrue(Hash::check('MotDePasse1', $user->password));
    }

    public function test_normalise_l_email_en_minuscules_et_le_pseudo_sans_espaces(): void
    {
        $this->postJson('/api/auth/register', $this->inscription([
            'email' => '  Goutte@Example.TEST ',
            'pseudo' => ' Goutte ',
        ]))->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'goutte@example.test', 'pseudo' => 'Goutte']);
    }

    public function test_refuse_un_email_deja_utilise_meme_avec_une_autre_casse(): void
    {
        User::factory()->create(['email' => 'goutte@example.test']);

        $this->postJson('/api/auth/register', $this->inscription(['email' => 'GOUTTE@example.test']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_refuse_un_pseudo_deja_pris(): void
    {
        User::factory()->create(['pseudo' => 'Goutte']);

        $this->postJson('/api/auth/register', $this->inscription())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pseudo');
    }

    #[DataProvider('motsDePasseInvalides')]
    public function test_refuse_un_mot_de_passe_trop_faible(string $motDePasse): void
    {
        $this->postJson('/api/auth/register', $this->inscription([
            'password' => $motDePasse,
            'password_confirmation' => $motDePasse,
        ]))->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public static function motsDePasseInvalides(): array
    {
        return [
            'trop court' => ['Abc123'],
            'sans majuscule' => ['motdepasse1'],
            'sans minuscule' => ['MOTDEPASSE1'],
            'sans chiffre' => ['MotDePasse'],
        ];
    }

    public function test_refuse_une_confirmation_de_mot_de_passe_differente(): void
    {
        $this->postJson('/api/auth/register', $this->inscription(['password_confirmation' => 'Autre1234']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_refuse_un_sexe_hors_liste(): void
    {
        $this->postJson('/api/auth/register', $this->inscription(['sexe' => 'autre']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sexe');
    }

    public function test_refuse_un_code_de_parrainage_inconnu(): void
    {
        $this->postJson('/api/auth/register', $this->inscription(['code_parrainage' => 'INCONNU1']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code_parrainage');

        $this->assertDatabaseMissing('users', ['email' => 'goutte@example.test']);
    }

    public function test_cree_un_parrainage_avec_un_code_saisi_en_minuscules(): void
    {
        $parrain = User::factory()->create(['code_parrainage' => 'PARRAIN1']);
        Badge::create([
            'nom' => 'Bien accueilli',
            'condition_type' => 'action_specifique',
            'action_specifique' => 'inscrit_avec_code',
            'statut' => 'actif',
        ]);

        $this->postJson('/api/auth/register', $this->inscription(['code_parrainage' => ' parrain1 ']))
            ->assertCreated();

        $filleul = User::where('email', 'goutte@example.test')->first();
        $this->assertDatabaseHas('parrainages', [
            'parrain_id' => $parrain->id,
            'filleul_id' => $filleul->id,
            'statut' => 'en_attente',
        ]);
        $this->assertDatabaseCount('user_badges', 1);
        Notification::assertSentTo($parrain, FilleulInscritNotification::class);
    }

    // ── Connexion ───────────────────────────────────────────────

    public function test_connecte_avec_les_bons_identifiants(): void
    {
        $user = User::factory()->create([
            'email' => 'goutte@example.test',
            'password' => Hash::make('MotDePasse1'),
            'derniere_connexion' => null,
        ]);

        $this->postJson('/api/auth/login', ['email' => 'goutte@example.test', 'password' => 'MotDePasse1'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'pseudo', 'doit_changer_mdp']]);

        $this->assertNotNull($user->fresh()->derniere_connexion);
    }

    public function test_connecte_quelle_que_soit_la_casse_de_l_email(): void
    {
        User::factory()->create(['email' => 'goutte@example.test', 'password' => Hash::make('MotDePasse1')]);

        $this->postJson('/api/auth/login', ['email' => ' Goutte@Example.test', 'password' => 'MotDePasse1'])
            ->assertOk();
    }

    public function test_refuse_un_mauvais_mot_de_passe(): void
    {
        User::factory()->create(['email' => 'goutte@example.test', 'password' => Hash::make('MotDePasse1')]);

        $this->postJson('/api/auth/login', ['email' => 'goutte@example.test', 'password' => 'Faux12345'])
            ->assertUnauthorized()
            ->assertJsonMissingPath('token');
    }

    public function test_refuse_un_email_inconnu(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'personne@example.test', 'password' => 'MotDePasse1'])
            ->assertUnauthorized();
    }

    public function test_refuse_une_connexion_sans_champs(): void
    {
        $this->postJson('/api/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_refuse_l_ancien_email_d_un_compte_supprime(): void
    {
        $user = User::factory()->create(['email' => 'goutte@example.test', 'password' => Hash::make('MotDePasse1')]);
        $user->anonymiser();

        $this->postJson('/api/auth/login', ['email' => 'goutte@example.test', 'password' => 'MotDePasse1'])
            ->assertUnauthorized();
    }

    // ── Déconnexion ─────────────────────────────────────────────

    public function test_la_deconnexion_revoque_le_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_la_deconnexion_exige_d_etre_connecte(): void
    {
        $this->postJson('/api/auth/logout')->assertUnauthorized();
    }

    public function test_une_route_protegee_refuse_un_visiteur_sans_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    private function inscription(array $surcharges = []): array
    {
        return array_merge([
            'pseudo' => 'Goutte',
            'email' => 'goutte@example.test',
            'password' => 'MotDePasse1',
            'password_confirmation' => 'MotDePasse1',
            'sexe' => 'femme',
            'cgu_acceptees' => true,
            'confidentialite_acceptee' => true,
            'consentement_sante' => true,
            'majeur' => true,
        ], $surcharges);
    }
}
