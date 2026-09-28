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
        // 📖 Même raison que sur user_badges (migration
        //    add_unique_constraint_to_user_badges_table) : deux dons concurrents pour le même
        //    utilisateur pourraient sinon créer deux lignes user_defis pour le même défi. La
        //    contrainte permet un upsert atomique (ON CONFLICT) dans DefiService.
        Schema::table('user_defis', function (Blueprint $table) {
            $table->unique(['user_id', 'defi_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_defis', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'defi_id']);
        });
    }
};
