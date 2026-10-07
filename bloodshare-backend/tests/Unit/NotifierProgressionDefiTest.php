<?php

namespace Tests\Unit;

use App\Models\Defi;
use App\Models\User;
use App\Models\UserDefi;
use App\Notifications\ProgressionDefiNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierProgressionDefiTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifie_les_participants_ayant_contribue(): void
    {
        Notification::fake();

        $admin = User::factory()->create();
        $defi = Defi::create([
            'admin_id' => $admin->id,
            'titre' => 'Défi test',
            'type' => 'communautaire',
            'periode' => 'mensuel',
            'statut' => 'actif',
        ]);

        $participant = User::factory()->create();
        UserDefi::create(['user_id' => $participant->id, 'defi_id' => $defi->id, 'progression' => 3, 'complete' => false]);

        $nonParticipant = User::factory()->create();
        UserDefi::create(['user_id' => $nonParticipant->id, 'defi_id' => $defi->id, 'progression' => 0, 'complete' => false]);

        Artisan::call('notifications:progression-defi');

        Notification::assertSentTo($participant, ProgressionDefiNotification::class);
        Notification::assertNothingSentTo($nonParticipant);
    }

    public function test_ne_fait_rien_sans_defi_actif(): void
    {
        Notification::fake();

        Artisan::call('notifications:progression-defi');

        Notification::assertNothingSent();
    }
}
