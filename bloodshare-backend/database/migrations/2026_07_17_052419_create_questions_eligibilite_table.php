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
        Schema::create('questions_eligibilite', function (Blueprint $table) {
            $table->id();
            $table->integer('ordre')->default(1);
            $table->text('question');
            $table->enum('type_reponse', ['oui_non', 'numerique'])
                  ->default('oui_non');
            $table->enum('reponse_bloquante', ['oui', 'non'])
                  ->default('oui')
                  ->comment('Quelle réponse rend inéligible');
            $table->text('message_refus')
                  ->nullable()
                  ->comment('Message affiché si inéligible');
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions_eligibilite');
    }
};
