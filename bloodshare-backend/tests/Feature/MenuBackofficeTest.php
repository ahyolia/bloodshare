<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MenuBackofficeTest extends TestCase
{
    use RefreshDatabase;

    public function test_les_stocks_de_sang_suivent_l_administration_dans_le_menu(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'super_admin']));

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk()
            ->assertSeeInOrder([
                'Administration',
                'Opérations',
                'Stocks de sang',
                'Communication',
                'Gamification',
                'Contenu éditorial',
                'Utilisateurs',
            ]);
    }
}
