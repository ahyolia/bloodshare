<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_cartes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('carte_id')->constrained('cartes')->onDelete('cascade');
            $table->foreignId('booster_id')->constrained('boosters')->onDelete('cascade');
            $table->integer('quantite')->default(1);
            $table->timestamp('obtenue_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_cartes');
    }
};