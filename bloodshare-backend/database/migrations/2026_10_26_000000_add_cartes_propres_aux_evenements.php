<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // 📖 Un événement peut remettre sa propre carte (ex. la carte du forum IUT) :
    //    - evenements.carte_id : la carte qu'il remet. Vide → la carte générique. Supprimer
    //      la carte ne supprime pas l'événement, qui retombe sur la générique ;
    //    - cartes.generique : la carte Événement remise par défaut. Explicite plutôt que
    //      « toute carte non rattachée » : une carte créée pour le forum, pas encore
    //      rattachée à son événement, aurait sinon pu être remise à tous les événements.
    public function up(): void
    {
        Schema::table('evenements', function (Blueprint $table) {
            $table->foreignId('carte_id')->nullable()->after('qr_code_id')->constrained('cartes')->nullOnDelete();
        });

        Schema::table('cartes', function (Blueprint $table) {
            $table->boolean('generique')->default(false)->after('statut');
        });

        // Jusqu'ici, toute carte Événement était la carte générique.
        DB::table('cartes')->where('categorie', 'evenement')->update(['generique' => true]);
    }

    public function down(): void
    {
        Schema::table('cartes', function (Blueprint $table) {
            $table->dropColumn('generique');
        });

        Schema::table('evenements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carte_id');
        });
    }
};
