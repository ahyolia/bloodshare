<?php

namespace Tests\Feature;

use App\Models\Avatar;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// 📖 L'app mobile associe chaque avatar_id à un emoji (AVATARS dans
//    services/profil.service.ts) : les ids 1 à 8 doivent exister en base, chacun
//    sous son nom, sur toute base migrée, sans passer par les seeders.
class AvatarsTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'database/migrations/2026_10_23_000000_seed_avatars_emoji.php';

    public function test_les_migrations_creent_les_avatars_1_a_8_a_leur_id(): void
    {
        $this->assertSame(
            collect(range(1, 8))->mapWithKeys(fn ($id) => [$id => "Avatar {$id}"])->all(),
            DB::table('avatars')->orderBy('id')->pluck('nom', 'id')->all()
        );
    }

    public function test_un_nouvel_avatar_ne_reprend_pas_un_id_existant(): void
    {
        // Ids insérés à la main : sans recaler la séquence Postgres, cette insertion
        // reprendrait l'id 1 et échouerait sur la clé primaire.
        $avatar = Avatar::create(['nom' => 'Avatar 9', 'image_url' => null, 'actif' => true]);

        $this->assertSame(9, $avatar->id);
    }

    public function test_complete_une_base_qui_n_a_que_les_avatars_1_a_5(): void
    {
        // État de Dokploy et Neon avant cette migration (AvatarSeeder n'en créait que 5).
        DB::table('avatars')->where('id', '>', 5)->delete();

        $this->migration()->up();

        $this->assertSame(range(1, 8), DB::table('avatars')->orderBy('id')->pluck('id')->all());
    }

    public function test_refuse_un_id_qui_porte_un_autre_avatar(): void
    {
        // Avatar supprimé puis recréé : l'id 6 porterait l'avatar 7, et l'app afficherait
        // la flamme à qui a choisi la lune. On préfère bloquer que se tromper en silence.
        DB::table('avatars')->where('id', 6)->update(['nom' => 'Avatar 7']);
        DB::table('avatars')->where('id', 7)->delete();

        $this->expectExceptionMessage('avatars.id 6');

        $this->migration()->up();
    }

    private function migration(): object
    {
        return require base_path(self::MIGRATION);
    }
}
