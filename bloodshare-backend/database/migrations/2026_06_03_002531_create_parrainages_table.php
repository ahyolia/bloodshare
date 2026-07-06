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
        Schema::create('parrainages', function (Blueprint $table) {
            $table->id();
            //Crée une colonne parrain_id dans la table actuelle (parrainages), 
            // et assure-toi que chaque valeur enregistrée ici correspond à un id existant dans la table users.
            $table->foreignId('parrain_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('filleul_id')->constrained('users')->onDelete('cascade');
            $table->enum('statut', ['en_attente', 'valide'])->default('en_attente');
            $table->timestamp('valide_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parrainages');
    }
};
