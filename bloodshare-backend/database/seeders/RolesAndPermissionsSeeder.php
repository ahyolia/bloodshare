<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Créer les rôles seulement s'ils n'existent pas
        Role::firstOrCreate(['name' => 'super_admin']);
        Role::firstOrCreate(['name' => 'admin']);

        // Assigner super_admin à votre user test
        $user = User::where('email', 'ygjjk16@gmail.com')->first();
        $user->assignRole('super_admin');
    }
}