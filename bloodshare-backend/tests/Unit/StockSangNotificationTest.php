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
        $stock = StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
        $user = User::factory()->create();

        // 📖 Rechargé en base (comme le fait le BO en édition) plutôt que réutiliser la
        //    même instance : wasRecentlyCreated reste vrai sur l'instance d'origine pour
        //    toute sa durée de vie, un second save() sur CETTE instance redéclencherait
        //    l'alerte même sans changement — un comportement qu'un vrai flux d'édition
        //    (fetch frais) ne reproduit jamais.
        $stockRecharge = StockSang::find($stock->id);

        Notification::fake();
        $stockRecharge->update(['maj_at' => now()]);

        Notification::assertNothingSentTo($user);
    }

    public function test_un_stock_cree_directement_en_critique_declenche_l_alerte(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);

        Notification::assertSentTo($user, AlertePenurieNotification::class);
    }

    public function test_passer_de_critique_a_bas_ne_remercie_pas(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $stock = StockSang::create(['groupe_sanguin' => 'O-', 'niveau' => 'critique']);
        $stock->update(['niveau' => 'bas']);

        Notification::assertNotSentTo($user, RemerciementPenurieNotification::class);
    }
}
