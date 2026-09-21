<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 📖 Tous les seeders sont idempotents : relancer ne duplique rien et ne plante pas.
        //    Les rôles passent en premier (le super admin en a besoin).
        $this->call([
            RolesAndPermissionsSeeder::class,
            AvatarSeeder::class,
            CarteSeeder::class,
            BadgeSeeder::class,
            QrCodeSeeder::class,
            QuestionEligibiliteSeeder::class,
        ]);

        // Compte de test pour l'app mobile, en local uniquement (jamais en production).
        if (app()->environment('local')) {
            User::firstOrCreate(
                ['email' => 'test@example.com'],
                ['pseudo' => 'Test User', 'password' => 'password']
            );
        }
    }
}
