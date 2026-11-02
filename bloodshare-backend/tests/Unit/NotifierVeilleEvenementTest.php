<?php

namespace Tests\Unit;

use App\Models\Evenement;
use App\Models\User;
use App\Notifications\VeilleEvenementNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierVeilleEvenementTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifie_la_veille_d_un_evenement_publie(): void
    {
        $user = User::factory()->create();
        Evenement::create([
            'titre' => 'Collecte demain',
            'lieu' => 'Nouméa',
            'date_heure' => now()->addDay(),
            'statut' => 'publie',
        ]);

        Notification::fake();

        Artisan::call('notifications:veille-evenement');

        Notification::assertSentTo($user, VeilleEvenementNotification::class);
    }

    public function test_ne_notifie_pas_un_evenement_dans_trois_jours(): void
    {
        $user = User::factory()->create();
        Evenement::create([
            'titre' => 'Collecte dans 3 jours',
            'lieu' => 'Nouméa',
            'date_heure' => now()->addDays(3),
            'statut' => 'publie',
        ]);

        Notification::fake();

        Artisan::call('notifications:veille-evenement');

        Notification::assertNothingSentTo($user);
    }

    public function test_ne_notifie_pas_un_evenement_non_publie(): void
    {
        $user = User::factory()->create();
        Evenement::create([
            'titre' => 'Collecte brouillon',
            'lieu' => 'Nouméa',
            'date_heure' => now()->addDay(),
            'statut' => 'brouillon',
        ]);

        Notification::fake();

        Artisan::call('notifications:veille-evenement');

        Notification::assertNothingSentTo($user);
    }
}
