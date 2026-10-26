<?php

use App\Models\Carte;
use Database\Seeders\VisuelsSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // 📖 Carte Fidèle : récompense l'ancienneté du donneur (un don validé au moins un an
    //    après son tout premier, voir CarteFideleService). Nouvelle catégorie `fidele` :
    //    `categorie` est un enum, donc une contrainte CHECK sous PostgreSQL à recréer.
    //    La carte est créée ici et non par CarteSeeder seul : Dokploy et sae203 ne lancent
    //    pas les seeders.
    public function up(): void
    {
        DB::statement('ALTER TABLE cartes DROP CONSTRAINT cartes_categorie_check');
        DB::statement("ALTER TABLE cartes ADD CONSTRAINT cartes_categorie_check
            CHECK (categorie IN ('mois_don', 'evenement', 'parrain', 'filleul', 'fidele'))");

        Carte::firstOrCreate(
            ['categorie' => 'fidele', 'mois_numero' => null],
            [
                'titre' => 'Carte Fidèle',
                'description' => 'Carte obtenue après un an de dons',
                'statut' => 'active',
            ]
        );

        (new VisuelsSeeder())->run();
    }

    public function down(): void
    {
        Carte::where('categorie', 'fidele')->delete();

        DB::statement('ALTER TABLE cartes DROP CONSTRAINT cartes_categorie_check');
        DB::statement("ALTER TABLE cartes ADD CONSTRAINT cartes_categorie_check
            CHECK (categorie IN ('mois_don', 'evenement', 'parrain', 'filleul'))");
    }
};
