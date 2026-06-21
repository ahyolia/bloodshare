<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modifier l'enum type → uniquement communautaire
        DB::statement("ALTER TABLE defis 
            DROP CONSTRAINT defis_type_check");
        DB::statement("ALTER TABLE defis 
            ADD CONSTRAINT defis_type_check 
            CHECK (type IN ('communautaire'))");

        // Modifier l'enum periode → uniquement mensuel
        DB::statement("ALTER TABLE defis 
            DROP CONSTRAINT defis_periode_check");
        DB::statement("ALTER TABLE defis 
            ADD CONSTRAINT defis_periode_check 
            CHECK (periode IN ('mensuel'))");

        // Retirer condition_type (conditions individuelles)
        Schema::table('defis', function (Blueprint $table) {
            $table->dropColumn('condition_type');
        });
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE defis 
            DROP CONSTRAINT defis_type_check");
        DB::statement("ALTER TABLE defis 
            ADD CONSTRAINT defis_type_check 
            CHECK (type IN ('individuel', 'communautaire'))");

        DB::statement("ALTER TABLE defis 
            DROP CONSTRAINT defis_periode_check");
        DB::statement("ALTER TABLE defis 
            ADD CONSTRAINT defis_periode_check 
            CHECK (periode IN ('permanent', 'mensuel'))");

        Schema::table('defis', function (Blueprint $table) {
            $table->enum('condition_type', ['nb_dons', 'quiz', 'qr_code'])->nullable();
        });
    }
};