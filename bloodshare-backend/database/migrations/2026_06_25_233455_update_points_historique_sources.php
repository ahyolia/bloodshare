<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE points_historique DROP CONSTRAINT points_historique_source_check");

        DB::statement("ALTER TABLE points_historique
            ADD CONSTRAINT points_historique_source_check
            CHECK (source IN ('quiz', 'defi', 'parrainage'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE points_historique DROP CONSTRAINT points_historique_source_check");

        DB::statement("ALTER TABLE points_historique
            ADD CONSTRAINT points_historique_source_check
            CHECK (source IN ('don', 'quiz', 'defi', 'qr_code', 'parrainage', 'doublon'))");
    }
};
