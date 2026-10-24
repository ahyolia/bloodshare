<?php

namespace Tests\Feature;

use App\Models\User;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Minishlink\WebPush\MessageSentReport;
use NotificationChannels\WebPush\Events\NotificationFailed;
use NotificationChannels\WebPush\PushSubscription;
use NotificationChannels\WebPush\WebPushMessage;
use Tests\TestCase;

class AbonnementPushRefuseTest extends TestCase
{
    use RefreshDatabase;

    private PushSubscription $abonnement;

    protected function setUp(): void
    {
        parent::setUp();

        $this->abonnement = User::factory()->create()->updatePushSubscription('https://fcm.googleapis.com/fcm/send/test', 'cle', 'secret');
    }

    public function test_supprime_un_abonnement_refuse_en_403_cle_vapid_differente(): void
    {
        $this->echec(403);

        $this->assertModelMissing($this->abonnement);
    }

    public function test_garde_l_abonnement_sur_une_erreur_passagere(): void
    {
        $this->echec(500);

        $this->assertModelExists($this->abonnement);
    }

    private function echec(int $statut): void
    {
        $rapport = new MessageSentReport(
            new Request('POST', $this->abonnement->endpoint),
            new Response($statut),
            false,
            'échec'
        );

        event(new NotificationFailed($rapport, $this->abonnement, new WebPushMessage()));
    }
}
