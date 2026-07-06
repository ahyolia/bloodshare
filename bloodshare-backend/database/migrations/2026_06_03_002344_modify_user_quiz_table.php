<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_quiz', function (Blueprint $table) {
            $table->boolean('points_attribues')->default(false)->after('complete');
            $table->integer('nb_tentatives')->default(0)->after('points_attribues');
        });
    }

    public function down(): void
    {
        Schema::table('user_quiz', function (Blueprint $table) {
            $table->dropColumn(['points_attribues', 'nb_tentatives']);
        });
    }
};
