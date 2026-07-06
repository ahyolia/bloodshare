<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    // PostgreSQL ne permet pas de modifier un enum directement
    // On doit recréer la contrainte
    DB::statement("ALTER TABLE contenus DROP CONSTRAINT contenus_type_check");
    DB::statement("ALTER TABLE contenus ADD CONSTRAINT contenus_type_check 
        CHECK (type IN ('fiche_info', 'actualite'))");
}

public function down(): void
{
    DB::statement("ALTER TABLE contenus DROP CONSTRAINT contenus_type_check");
    DB::statement("ALTER TABLE contenus ADD CONSTRAINT contenus_type_check 
        CHECK (type IN ('fiche_info', 'actualite', 'don_du_mois'))");
}
};
