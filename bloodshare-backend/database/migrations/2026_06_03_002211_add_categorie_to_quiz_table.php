<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz', function (Blueprint $table) {
            $table->string('categorie')->nullable()->after('titre');
        });
    }

    public function down(): void
    {
        Schema::table('quiz', function (Blueprint $table) {
            $table->dropColumn('categorie');
        });
    }
};
