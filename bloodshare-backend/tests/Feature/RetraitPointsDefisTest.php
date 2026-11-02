<?php

namespace Tests\Feature;

use App\Models\PointsHistorique;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Un don ne rapporte jamais de points (règle éthique ADSB-NC) : les anciens points
// « défi » sont retirés et la base refuse désormais cette source.
class RetraitPointsDefisTest extends TestCase
{
    use RefreshDatabase;

    private function migration(): object
    {
        return require database_path('migrations/2026_10_20_000002_retire_points_des_defis.php');
    }

    // Recrée l'état d'avant la migration : la source « defi » était encore acceptée.
    private function autoriserAnciennementLesDefis(): void
    {
        $this->migration()->down();
    }

    public function test_retire_les_points_defi_du_total_et_de_l_historique(): void
    {
        $this->autoriserAnciennementLesDefis();

        $user = User::factory()->create(['points_cumules' => 130]);
        PointsHistorique::create(['user_id' => $user->id, 'points' => 30, 'source' => 'quiz']);
        PointsHistorique::create(['user_id' => $user->id, 'points' => 100, 'source' => 'defi']);

        $sansDefi = User::factory()->create(['points_cumules' => 75]);
        PointsHistorique::create(['user_id' => $sansDefi->id, 'points' => 75, 'source' => 'parrainage']);

        $this->migration()->up();

        $this->assertSame(30, $user->fresh()->points_cumules);
        $this->assertSame(75, $sansDefi->fresh()->points_cumules);
        $this->assertDatabaseMissing('points_historique', ['source' => 'defi']);
        $this->assertDatabaseHas('points_historique', ['user_id' => $user->id, 'source' => 'quiz']);
    }

    public function test_un_total_ne_devient_jamais_negatif(): void
    {
        $this->autoriserAnciennementLesDefis();

        // Total déjà incohérent (inférieur aux points « défi ») : on s'arrête à 0.
        $user = User::factory()->create(['points_cumules' => 40]);
        PointsHistorique::create(['user_id' => $user->id, 'points' => 100, 'source' => 'defi']);

        $this->migration()->up();

        $this->assertSame(0, $user->fresh()->points_cumules);
    }

    public function test_la_base_refuse_desormais_des_points_de_defi(): void
    {
        $user = User::factory()->create();

        $this->expectException(QueryException::class);

        DB::table('points_historique')->insert([
            'user_id' => $user->id,
            'points' => 50,
            'source' => 'defi',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
