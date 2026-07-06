<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('titre');
            $table->text('description')->nullable();
            $table->boolean('aleatoire')->default(false);
            $table->integer('points_attribues')->default(0);
            $table->enum('statut', ['brouillon', 'actif', 'inactif'])->default('brouillon');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz');
    }
};