<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    // ── Historique ──────────────────────────────────────────────

    public function test_liste_les_notifications_de_l_utilisateur(): void
    {
        $this->creerNotification($this->user, 'Nouveau badge', 'Bravo !');

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('data.0.titre', 'Nouveau badge')
            ->assertJsonPath('data.0.corps', 'Bravo !')
            ->assertJsonPath('data.0.lue', false);
    }

    public function test_donne_la_categorie_d_affichage_de_la_notification(): void
    {
        $this->creerNotification($this->user, 'Inconnue');
        $this->creerNotification($this->user, 'Badge', type: 'App\\Notifications\\BadgeDebloqueNotification');

        $categories = collect($this->getJson('/api/notifications')->json('data'))->pluck('categorie', 'titre');

        $this->assertSame('badge', $categories['Badge']);
        $this->assertSame('autre', $categories['Inconnue']);
    }

    public function test_ne_montre_pas_les_notifications_des_autres(): void
    {
        $this->creerNotification(User::factory()->create(), 'Pas pour moi');

        $this->getJson('/api/notifications')->assertJsonCount(0, 'data');
    }

    public function test_pagine_par_20(): void
    {
        for ($i = 0; $i < 25; $i++) {
            $this->creerNotification($this->user, "Notif {$i}");
        }

        $this->getJson('/api/notifications')
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('total', 25);
    }

    public function test_compte_les_notifications_non_lues(): void
    {
        $this->creerNotification($this->user, 'A');
        $this->creerNotification($this->user, 'B');
        $this->creerNotification($this->user, 'C', lue: true);

        $this->getJson('/api/notifications/non-lues')->assertExactJson(['count' => 2]);
    }

    public function test_marque_une_notification_comme_lue(): void
    {
        $id = $this->creerNotification($this->user, 'A');

        $this->putJson("/api/notifications/{$id}/lue")->assertOk();

        $this->getJson('/api/notifications/non-lues')->assertExactJson(['count' => 0]);
    }

    public function test_ne_peut_pas_marquer_la_notification_d_un_autre(): void
    {
        $autre = User::factory()->create();
        $id = $this->creerNotification($autre, 'A');

        $this->putJson("/api/notifications/{$id}/lue")->assertNotFound();

        $this->assertSame(1, $autre->unreadNotifications()->count());
    }

    public function test_marque_toutes_les_notifications_comme_lues(): void
    {
        $this->creerNotification($this->user, 'A');
        $this->creerNotification($this->user, 'B');

        $this->putJson('/api/notifications/lues')->assertOk();

        $this->getJson('/api/notifications/non-lues')->assertExactJson(['count' => 0]);
    }

    public function test_accepte_un_put_envoye_en_post_avec_x_http_method_override(): void
    {
        // 📖 Le serveur de démo refuse PUT/DELETE au niveau d'Apache : l'app les envoie en
        //    POST avec la vraie méthode dans cet en-tête (services/api.ts). Si Laravel cessait
        //    de le lire, profil, suppression de compte et notifications casseraient en ligne.
        $id = $this->creerNotification($this->user, 'A');
        $this->creerNotification($this->user, 'B');

        $this->postJson("/api/notifications/{$id}/lue", [], ['X-HTTP-Method-Override' => 'PUT'])->assertOk();
        $this->getJson('/api/notifications/non-lues')->assertExactJson(['count' => 1]);

        $this->postJson('/api/notifications/lues', [], ['X-HTTP-Method-Override' => 'PUT'])->assertOk();
        $this->getJson('/api/notifications/non-lues')->assertExactJson(['count' => 0]);
    }

    // ── Abonnement push ─────────────────────────────────────────

    public function test_enregistre_un_abonnement_push(): void
    {
        $this->postJson('/api/notifications/subscription', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc',
            'keys' => ['p256dh' => 'cle', 'auth' => 'secret'],
        ])->assertCreated();

        $this->assertSame(1, $this->user->pushSubscriptions()->count());
    }

    #[DataProvider('endpointsRefuses')]
    public function test_refuse_une_adresse_qui_n_est_pas_un_service_de_push(string $endpoint): void
    {
        // 📖 Audit cybersécurité (SSRF) : le serveur envoie une requête POST à cette adresse.
        $this->postJson('/api/notifications/subscription', [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'cle', 'auth' => 'secret'],
        ])->assertUnprocessable()->assertJsonValidationErrors('endpoint');

        $this->assertSame(0, $this->user->pushSubscriptions()->count());
    }

    public static function endpointsRefuses(): array
    {
        return [
            'serveur lui-même' => ['http://127.0.0.1:8000/up'],
            'panel Dokploy' => ['http://dokploy:3000/api'],
            'base de données' => ['http://db:5432'],
            'métadonnées cloud' => ['http://169.254.169.254/latest/meta-data'],
            'service connu en HTTP' => ['http://fcm.googleapis.com/fcm/send/abc'],
            'faux sous-domaine' => ['https://fcm.googleapis.com.attaquant.test/x'],
            'port forcé' => ['https://fcm.googleapis.com:8443/x'],
            'identifiants dans l\'URL' => ['https://moi@fcm.googleapis.com/x'],
            'pas une URL' => ['javascript:alert(1)'],
        ];
    }

    public function test_accepte_les_services_de_push_des_navigateurs(): void
    {
        foreach ([
            'https://fcm.googleapis.com/fcm/send/a',
            'https://updates.push.services.mozilla.com/wpush/v2/b',
            'https://web.push.apple.com/c',
            'https://wns2-par02p.notify.windows.com/w/?token=d',
        ] as $endpoint) {
            $this->postJson('/api/notifications/subscription', [
                'endpoint' => $endpoint,
                'keys' => ['p256dh' => 'cle', 'auth' => 'secret'],
            ])->assertCreated();
        }

        $this->assertSame(4, $this->user->pushSubscriptions()->count());
    }

    public function test_refuse_un_abonnement_sans_cles(): void
    {
        $this->postJson('/api/notifications/subscription', ['endpoint' => 'https://fcm.googleapis.com/fcm/send/abc'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['keys', 'keys.p256dh', 'keys.auth']);
    }

    public function test_retire_un_abonnement_push(): void
    {
        $this->postJson('/api/notifications/subscription', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc',
            'keys' => ['p256dh' => 'cle', 'auth' => 'secret'],
        ]);

        $this->deleteJson('/api/notifications/subscription', ['endpoint' => 'https://fcm.googleapis.com/fcm/send/abc'])
            ->assertOk();

        $this->assertSame(0, $this->user->pushSubscriptions()->count());
    }

    private function creerNotification(User $user, string $titre, string $corps = '', bool $lue = false, string $type = 'App\\Notifications\\Test'): string
    {
        $id = (string) Str::uuid();
        $user->notifications()->create([
            'id' => $id,
            'type' => $type,
            'data' => ['title' => $titre, 'body' => $corps],
            'read_at' => $lue ? now() : null,
        ]);

        return $id;
    }
}
