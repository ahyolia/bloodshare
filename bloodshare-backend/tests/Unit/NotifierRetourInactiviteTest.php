<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\RetourInactiviteNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierRetourInactiviteTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifie_un_utilisateur_inactif_depuis_exactement_30_jours(): void
    {
        Notification::fake();

        $user = User::factory()->create(['derniere_connexion' => now()->subDays(30)]);

        Artisan::call('notifications:retour-inactivite');

        Notification::assertSentTo($user, RetourInactiviteNotification::class);
    }

    public function test_ne_notifie_pas_un_utilisateur_inactif_depuis_60_jours(): void
    {
        Notification::fake();

        $user = User::factory()->create(['derniere_connexion' => now()->subDays(60)]);

        Artisan::call('notifications:retour-inactivite');

        Notification::assertNothingSentTo($user);
    }
}
