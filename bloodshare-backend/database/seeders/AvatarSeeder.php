<?php

namespace Database\Seeders;

use App\Models\Avatar;
use Illuminate\Database\Seeder;

class AvatarSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            Avatar::updateOrCreate(
                ['nom' => "Avatar {$i}"],
                [
                    'image_url' => null,
                    'actif' => true,
                ]
            );
        }
    }
}
