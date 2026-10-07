<?php

namespace Tests\Unit;

use App\Models\StockSang;
use App\Models\User;
use App\Notifications\AlertePenurieNotification;
use App\Notifications\RemerciementPenurieNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class StockSangNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_passage_a_critique_notifie_tous_les_utilisateurs(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $stock = StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'correct']);
        $stock->update(['niveau' => 'critique']);

        Notification::assertSentTo($user, AlertePenurieNotification::class);
    }

    public function test_sortir_de_critique_remercie_tous_les_utilisateurs(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $stock = StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
        $stock->update(['niveau' => 'correct']);

        Notification::assertSentTo($user, RemerciementPenurieNotification::class);
    }

    public function test_une_sauvegarde_qui_ne_change_pas_le_niveau_ne_notifie_pas(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $stock = StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
        $stock->update(['maj_at' => now()]);

        Notification::assertNothingSentTo($user);
    }
}
