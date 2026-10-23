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
        // 📖 C'est la migration 2026_10_23_000000_seed_avatars_emoji qui crée ces avatars
        //    à leur id (les seeders ne tournent pas au déploiement) : ici, rien à faire
        //    sur une base migrée, ce seeder ne sert qu'à garder l'état cohérent si on le relance.
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
