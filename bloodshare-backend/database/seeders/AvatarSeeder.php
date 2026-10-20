<?php

namespace Database\Seeders;

use App\Models\Avatar;
use Illuminate\Database\Seeder;

class AvatarSeeder extends Seeder
{
    public function run(): void
    {
        // Un enregistrement par avatar emoji du catalogue mobile
        // (AVATARS dans services/profil.service.ts) : les ids doivent correspondre.
        for ($i = 1; $i <= 8; $i++) {
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
