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
        // User::factory(10)->create();

        User::factory()->create([
            'pseudo' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call([
            AvatarSeeder::class,
            CarteSeeder::class,
            BadgeSeeder::class,
            QrCodeSeeder::class,
            QuestionEligibiliteSeeder::class,
        ]);
    }
}
