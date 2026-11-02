<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Tests\TestCase;

class PurgerNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_supprime_les_notifications_de_plus_d_un_an_et_garde_les_recentes(): void
    {
        $user = User::factory()->create();
        $ancienne = $this->notification($user, now()->subYear()->subDay());
        $recente = $this->notification($user, now()->subMonths(11));

        Artisan::call('donnees:purger-notifications');

        $this->assertDatabaseMissing('notifications', ['id' => $ancienne]);
        $this->assertDatabaseHas('notifications', ['id' => $recente]);
        $this->assertStringContainsString('1 notification(s) supprimée(s)', Artisan::output());
    }

    private function notification(User $user, $date): string
    {
        $id = (string) Str::uuid();
        $user->notifications()->create(['id' => $id, 'type' => 'test', 'data' => ['message' => 'Rappel']]);
        $user->notifications()->where('id', $id)->update(['created_at' => $date]);

        return $id;
    }
}
