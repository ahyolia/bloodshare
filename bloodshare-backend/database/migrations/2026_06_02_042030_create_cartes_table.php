<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cartes', function (Blueprint $table) {
            $table->id('id')->primary();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->enum('rarete', ['commun', 'rare']);
            $table->enum('statut', ['active', 'desactivee'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cartes');
    }
};