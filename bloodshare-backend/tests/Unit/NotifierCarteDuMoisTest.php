<?php

namespace Tests\Unit;

use App\Models\Carte;
use App\Models\User;
use App\Notifications\CarteDuMoisNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierCarteDuMoisTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_notifie_un_eligible_sans_la_carte_7_jours_avant_la_fin_du_mois(): void
    {
        // 📖 Janvier a 31 jours : le 24 janvier est à exactement 7 jours de la fin.
        Carbon::setTestNow(Carbon::parse('2026-01-24'));
        Notification::fake();

        Carte::create(['titre' => 'Carte Janvier', 'categorie' => 'mois_don', 'mois_numero' => 1, 'statut' => 'active']);
        $user = User::factory()->create(['sexe' => 'homme']);

        Artisan::call('notifications:carte-du-mois');

        Notification::assertSentTo($user, CarteDuMoisNotification::class);
    }

    public function test_ne_notifie_rien_en_milieu_de_mois(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-10'));
        Notification::fake();

        Carte::create(['titre' => 'Carte Janvier', 'categorie' => 'mois_don', 'mois_numero' => 1, 'statut' => 'active']);
        $user = User::factory()->create(['sexe' => 'homme']);

        Artisan::call('notifications:carte-du-mois');

        Notification::assertNothingSentTo($user);
    }
}
