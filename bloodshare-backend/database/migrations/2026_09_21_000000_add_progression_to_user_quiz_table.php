<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_quiz', function (Blueprint $table) {
            // 📖 Réponses déjà données à un quiz commencé mais pas terminé, sous la forme
            //    { "<question_id>": [<reponse_id>, ...] }. Vidé à la soumission finale.
            $table->json('progression')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('user_quiz', function (Blueprint $table) {
            $table->dropColumn('progression');
        });
    }
};
