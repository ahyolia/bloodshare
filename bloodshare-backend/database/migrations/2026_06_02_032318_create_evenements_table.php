<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evenements', function (Blueprint $table) {
            $table->id('id')->primary();
            $table->foreignId('admin_id')->nullable()->constrained('users')->onDelete('set null');
            // Keep UUID link column without FK to avoid circular dependency with qr_codes migration.
            $table->uuid('qr_code_id')->nullable();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->string('lieu');
            $table->timestamp('date_heure');
            $table->enum('statut', ['brouillon', 'publie', 'annule', 'passe'])->default('brouillon');
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evenements');
    }
};