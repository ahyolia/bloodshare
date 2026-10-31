<?php

namespace Tests\Unit;

use App\Models\Defi;
use App\Models\Don;
use App\Models\User;
use App\Notifications\DefiReussiNotification;
use App\Services\DefiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class DefiReussiNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_les_contributeurs_sont_remercies_quand_l_objectif_est_atteint(): void
    {
        Notification::fake();

        $admin = User::factory()->create();
        $defi = Defi::create([
            'admin_id' => $admin->id,
            'titre' => 'Défi test',
            'type' => 'communautaire',
            'periode' => 'mensuel',
            'objectif_chiffre' => 1,
            'statut' => 'actif',
        ]);

        $user = User::factory()->create();
        Don::create(['user_id' => $user->id, 'date_don' => now(), 'statut' => 'valide']);

        app(DefiService::class)->enregistrerContribution($user);

        $this->assertSame('termine', $defi->fresh()->statut);
        Notification::assertSentTo($user, DefiReussiNotification::class);
    }
}
