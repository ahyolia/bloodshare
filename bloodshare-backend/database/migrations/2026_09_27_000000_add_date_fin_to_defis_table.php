<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 📖 Documenté dans contrat_API.md depuis le début (GET /defis/actuel) mais jamais
        //    stocké : le champ renvoyait toujours null en silence (DefiController::actuel()
        //    faisait `$defi->date_fin ?? null`, qui ne plantait pas faute de colonne).
        Schema::table('defis', function (Blueprint $table) {
            $table->date('date_fin')->nullable()->after('objectif_chiffre');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defis', function (Blueprint $table) {
            $table->dropColumn('date_fin');
        });
    }
};
