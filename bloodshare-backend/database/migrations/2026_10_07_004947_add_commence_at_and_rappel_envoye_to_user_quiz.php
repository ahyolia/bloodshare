<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_quiz', function (Blueprint $table) {
            // 📖 Nécessaire pour le rappel "quiz non terminé depuis 3 jours" : sans date de
            //    début, impossible de savoir depuis quand un quiz est en cours (user_quiz n'a
            //    pas de timestamps()). rappel_envoye évite de renvoyer le rappel chaque jour
            //    après le 3e (un seul rappel attendu).
            $table->timestamp('commence_at')->nullable()->after('quiz_id');
            $table->boolean('rappel_envoye')->default(false)->after('commence_at');
        });
    }

    public function down(): void
    {
        Schema::table('user_quiz', function (Blueprint $table) {
            $table->dropColumn(['commence_at', 'rappel_envoye']);
        });
    }
};
