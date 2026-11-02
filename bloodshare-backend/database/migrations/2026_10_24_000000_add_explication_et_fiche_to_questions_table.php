<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // 📖 Affichée après validation de la question, que la réponse soit juste ou
            //    fausse (retours des tests utilisateurs, US-30).
            $table->text('explication')->nullable();
            // 📖 Fiche pratique à ouvrir pour en savoir plus. Mise à null si la fiche est
            //    supprimée : la question reste jouable, simplement sans lien.
            $table->foreignId('contenu_id')->nullable()->constrained('contenus')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('contenu_id');
            $table->dropColumn('explication');
        });
    }
};
