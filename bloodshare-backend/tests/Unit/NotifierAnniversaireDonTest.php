<?php

namespace Tests\Unit;

use App\Models\Don;
use App\Models\User;
use App\Notifications\AnniversaireDonNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierAnniversaireDonTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifie_un_an_apres_le_premier_don_valide(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        Don::create(['user_id' => $user->id, 'date_don' => now()->subYear(), 'statut' => 'valide']);

        Artisan::call('notifications:anniversaire-don');

        Notification::assertSentTo($user, AnniversaireDonNotification::class);
    }

    public function test_ne_notifie_pas_un_don_vieux_de_6_mois(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        Don::create(['user_id' => $user->id, 'date_don' => now()->subMonths(6), 'statut' => 'valide']);

        Artisan::call('notifications:anniversaire-don');

        Notification::assertNothingSentTo($user);
    }
}
