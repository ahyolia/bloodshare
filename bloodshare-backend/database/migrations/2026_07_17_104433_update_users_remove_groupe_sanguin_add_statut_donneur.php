<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('groupe_sanguin');
            $table->enum('statut_donneur', [
                'donneur_regulier',
                'quelques_dons',
                'jamais_donne'
            ])->nullable()->after('sexe');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('statut_donneur');
            $table->enum('groupe_sanguin', [
                'A+','A-','B+','B-','AB+','AB-','O+','O-'
            ])->nullable()->after('sexe');
        });
    }
};
