<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('evenements', function (Blueprint $table) {
        $table->timestamp('horaire_fin')->nullable()->after('date_heure');
    });
}

public function down(): void
{
    Schema::table('evenements', function (Blueprint $table) {
        $table->dropColumn('horaire_fin');
    });
}
};
