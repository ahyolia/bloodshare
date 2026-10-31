<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contenus', function (Blueprint $table) {
            // 📖 Fiches pratiques : affiche (ou non) l'invitation « Tester ses connaissances »
            //    sous la fiche, et un fait court « Le saviez-vous ? » facultatif.
            $table->boolean('quiz_cta')->default(false);
            $table->text('le_saviez_vous')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('contenus', function (Blueprint $table) {
            $table->dropColumn(['quiz_cta', 'le_saviez_vous']);
        });
    }
};
