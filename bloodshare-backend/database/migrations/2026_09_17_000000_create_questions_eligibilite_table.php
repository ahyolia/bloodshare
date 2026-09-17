<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions_eligibilite', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('ordre');
            $table->string('question');
            $table->string('type_reponse')->default('oui_non');
            // 📖 Valeur ('oui' ou 'non') de la réponse qui rend le donneur
            //    inéligible pour cette question.
            $table->string('reponse_bloquante');
            $table->text('message_refus')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions_eligibilite');
    }
};
