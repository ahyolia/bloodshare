<?php

use App\Models\Badge;
use App\Models\Carte;
use Database\Seeders\VisuelsSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    // 📖 Migration et non seeder seul : entrypoint.sh ne lance les seeders que si
    //    RUN_SEEDERS=true, jamais sur Dokploy ni sae203. Le détail (fichiers, cartes et
    //    badges concernés, carte du forum) est dans VisuelsSeeder, réutilisé par
    //    DatabaseSeeder pour une base recréée de zéro.
    public function up(): void
    {
        (new VisuelsSeeder())->run();
    }

    public function down(): void
    {
        // Seules les images posées par cette migration : un upload du BO est conservé.
        Carte::where('image_url', 'like', 'visuels/%')->update(['image_url' => null]);
        Badge::where('image_url', 'like', 'visuels/%')->update(['image_url' => null]);
        Storage::disk('public')->deleteDirectory('visuels');

        Carte::where('categorie', 'evenement')
            ->where('titre', VisuelsSeeder::TITRE_CARTE_FORUM)
            ->whereDoesntHave('userCartes')
            ->delete();
    }
};
