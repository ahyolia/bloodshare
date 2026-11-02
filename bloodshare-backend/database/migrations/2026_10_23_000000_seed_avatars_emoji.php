<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // 📖 L'app mobile associe chaque avatar_id à un emoji (AVATARS dans
    //    bloodshare-mobile/services/profil.service.ts) : 1 🌸, 2 🌻, 3 🍀, 4 🌈, 5 ⭐,
    //    6 🌙, 7 🔥, 8 💧. Les ids sont donc fixés ici, pas laissés à l'auto-incrément.
    //    Migration et non seeder : entrypoint.sh ne lance les seeders que si
    //    RUN_SEEDERS=true, jamais sur Dokploy ni sae203, qui n'avaient que les avatars 1 à 5.
    private const NB_AVATARS = 8;

    public function up(): void
    {
        foreach (range(1, self::NB_AVATARS) as $id) {
            $nom = "Avatar {$id}";
            $existant = DB::table('avatars')->where('id', $id)->first();

            if ($existant) {
                // 📖 Un id qui porte un autre avatar (supprimé puis recréé) ferait afficher
                //    le mauvais emoji à tous ses utilisateurs, sans aucune erreur : on bloque.
                if ($existant->nom !== $nom) {
                    throw new RuntimeException(
                        "avatars.id {$id} est « {$existant->nom} » au lieu de « {$nom} » : l'app afficherait "
                        . "le mauvais emoji. Corriger la table avatars (et users.avatar_id) avant de relancer."
                    );
                }

                continue;
            }

            if (DB::table('avatars')->where('nom', $nom)->exists()) {
                throw new RuntimeException(
                    "« {$nom} » existe déjà sous un autre id que {$id} : l'app afficherait le mauvais emoji. "
                    . 'Corriger la table avatars (et users.avatar_id) avant de relancer.'
                );
            }

            DB::table('avatars')->insert([
                'id' => $id,
                'nom' => $nom,
                'image_url' => null,
                'actif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 📖 Des ids insérés à la main ne font pas avancer la séquence Postgres : sans ce
        //    recalage, le prochain avatar créé reprendrait l'id 1 et violerait la clé primaire.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('avatars', 'id'), (SELECT MAX(id) FROM avatars))");
        }
    }

    public function down(): void
    {
        // Seuls les avatars ajoutés par cette migration, et seulement s'ils ne sont pas choisis.
        DB::table('avatars')
            ->whereIn('id', [6, 7, 8])
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('users')->whereColumn('users.avatar_id', 'avatars.id'))
            ->delete();
    }
};
