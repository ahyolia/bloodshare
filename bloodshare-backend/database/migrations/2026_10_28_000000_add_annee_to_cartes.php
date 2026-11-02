<?php

use App\Models\Carte;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const MOIS = [
        1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril', 5 => 'Mai', 6 => 'Juin',
        7 => 'Juillet', 8 => 'Août', 9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
    ];

    // 📖 Une collection de cartes de mois par année : la carte de novembre 2027 est une
    //    autre carte que celle de novembre 2026, avec son propre dessin. Les cartes déjà
    //    en base forment la collection 2026.
    public function up(): void
    {
        Schema::table('cartes', function (Blueprint $table) {
            $table->smallInteger('annee')->nullable()->after('mois_numero');
        });

        DB::table('cartes')->where('categorie', 'mois_don')->whereNull('annee')->update(['annee' => 2026]);

        // Titres et descriptions encore par défaut : on y ajoute l'année (et l'élision :
        // « Carte d'Avril », plus « Carte de Avril »).
        foreach (self::MOIS as $numero => $nom) {
            $carte = DB::table('cartes')->where('categorie', 'mois_don')->where('annee', 2026)->where('mois_numero', $numero);
            (clone $carte)->where('titre', "Carte de {$nom}")->update(['titre' => Carte::titreMois($numero, 2026)]);
            (clone $carte)->where('description', "Carte obtenue lors d'un don en {$nom}")
                ->update(['description' => "Carte obtenue lors d'un don en {$nom} 2026"]);
        }

        // Une seule carte par mois et par année. Index partiel : les autres catégories n'ont
        // ni mois ni année.
        DB::statement("CREATE UNIQUE INDEX cartes_mois_annee_unique ON cartes (annee, mois_numero) WHERE categorie = 'mois_don'");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS cartes_mois_annee_unique');

        Schema::table('cartes', function (Blueprint $table) {
            $table->dropColumn('annee');
        });
    }
};
