<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->string('titre');
            $table->text('description')->nullable();
            $table->enum('type', ['individuel', 'communautaire']);
            $table->enum('periode', ['permanent', 'mensuel']);
            $table->enum('condition_type', ['nb_dons', 'quiz', 'qr_code']);
            $table->integer('objectif_chiffre')->nullable();
            $table->integer('points_attribues')->default(0);
            $table->enum('statut', ['brouillon', 'actif', 'termine'])->default('brouillon');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defis');
    }
};