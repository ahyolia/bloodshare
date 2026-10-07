<?php

namespace Tests\Unit;

use App\Models\Don;
use App\Models\User;
use App\Notifications\FinIneligibiliteNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierFinIneligibiliteTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifie_un_homme_dont_le_delai_de_56_jours_se_termine_aujourd_hui(): void
    {
        Notification::fake();

        $user = User::factory()->create(['sexe' => 'homme']);
        Don::create(['user_id' => $user->id, 'date_don' => now()->subDays(56), 'statut' => 'valide']);

        Artisan::call('notifications:fin-ineligibilite');

        Notification::assertSentTo($user, FinIneligibiliteNotification::class);
    }

    public function test_notifie_une_femme_dont_le_delai_de_84_jours_se_termine_aujourd_hui(): void
    {
        Notification::fake();

        $user = User::factory()->create(['sexe' => 'femme']);
        Don::create(['user_id' => $user->id, 'date_don' => now()->subDays(84), 'statut' => 'valide']);

        Artisan::call('notifications:fin-ineligibilite');

        Notification::assertSentTo($user, FinIneligibiliteNotification::class);
    }

    public function test_ne_notifie_pas_un_utilisateur_encore_ineligible(): void
    {
        Notification::fake();

        $user = User::factory()->create(['sexe' => 'homme']);
        Don::create(['user_id' => $user->id, 'date_don' => now()->subDays(10), 'statut' => 'valide']);

        Artisan::call('notifications:fin-ineligibilite');

        Notification::assertNothingSentTo($user);
    }

    public function test_ne_notifie_pas_un_don_non_valide(): void
    {
        Notification::fake();

        $user = User::factory()->create(['sexe' => 'homme']);
        Don::create(['user_id' => $user->id, 'date_don' => now()->subDays(56), 'statut' => 'en_attente']);

        Artisan::call('notifications:fin-ineligibilite');

        Notification::assertNothingSentTo($user);
    }
}
