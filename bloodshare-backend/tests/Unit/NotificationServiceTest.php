<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\JourneeMondialeNotification;
use App\Notifications\NiveauAtteintNotification;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    // 📖 verifierNouveauNiveau est branché sur l'événement `updated` de User (User::booted) :
    //    on passe donc par un vrai update(), comme le fait le reste de l'application.

    public function test_notifie_le_passage_a_un_nouveau_niveau(): void
    {
        $user = User::factory()->create(['points_cumules' => 90]);

        $user->increment('points_cumules', 20);

        Notification::assertSentTo($user, NiveauAtteintNotification::class);
    }

    public function test_ne_notifie_pas_un_gain_de_points_dans_le_meme_niveau(): void
    {
        $user = User::factory()->create(['points_cumules' => 10]);

        $user->increment('points_cumules', 20);

        Notification::assertNothingSentTo($user);
    }

    public function test_ne_notifie_pas_une_modification_sans_rapport_avec_les_points(): void
    {
        $user = User::factory()->create(['points_cumules' => 150]);

        $user->update(['pseudo' => 'NouveauPseudo']);

        Notification::assertNothingSentTo($user);
    }

    public function test_ne_notifie_pas_une_perte_de_niveau(): void
    {
        $user = User::factory()->create(['points_cumules' => 150]);

        $user->update(['points_cumules' => 50]);

        Notification::assertNothingSentTo($user);
    }

    public function test_notifie_tous_les_utilisateurs_sauf_les_comptes_supprimes(): void
    {
        $actif = User::factory()->create(['statut' => 'actif']);
        $suspendu = User::factory()->create(['statut' => 'suspendu']);
        $supprime = User::factory()->create(['statut' => 'supprime']);

        app(NotificationService::class)->notifierTousLesUsers(new JourneeMondialeNotification());

        Notification::assertSentTo($actif, JourneeMondialeNotification::class);
        Notification::assertSentTo($suspendu, JourneeMondialeNotification::class);
        Notification::assertNothingSentTo($supprime);
    }

    public function test_enregistre_puis_retire_un_abonnement_push(): void
    {
        $user = User::factory()->create();
        $service = app(NotificationService::class);

        $service->enregistrerAbonnement($user, [
            'endpoint' => 'https://push.example.test/abc',
            'keys' => ['p256dh' => 'cle', 'auth' => 'secret'],
        ]);
        $this->assertDatabaseHas('push_subscriptions', [
            'endpoint' => 'https://push.example.test/abc',
            'content_encoding' => 'aes128gcm',
        ]);

        $service->retirerAbonnement($user, 'https://push.example.test/abc');
        $this->assertDatabaseCount('push_subscriptions', 0);
    }
}
