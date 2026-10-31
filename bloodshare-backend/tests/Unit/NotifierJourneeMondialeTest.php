<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\JourneeMondialeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierJourneeMondialeTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_notifie_tous_les_utilisateurs_le_14_juin(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-14'));
        Notification::fake();

        $user = User::factory()->create();

        Artisan::call('notifications:journee-mondiale');

        Notification::assertSentTo($user, JourneeMondialeNotification::class);
    }

    public function test_ne_fait_rien_un_autre_jour(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-15'));
        Notification::fake();

        $user = User::factory()->create();

        Artisan::call('notifications:journee-mondiale');

        Notification::assertNothingSentTo($user);
    }
}
