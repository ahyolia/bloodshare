<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cartes', function (Blueprint $table) {
            $table->dropColumn('rarete');
            $table->enum('categorie', ['mois_don', 'evenement', 'parrain', 'filleul'])->after('image_url');
            $table->integer('mois_numero')->nullable()->after('categorie');
        });
    }

    public function down(): void
    {
        Schema::table('cartes', function (Blueprint $table) {
            $table->dropColumn(['categorie', 'mois_numero']);
            $table->enum('rarete', ['commun', 'rare'])->after('image_url');
        });
    }
};
