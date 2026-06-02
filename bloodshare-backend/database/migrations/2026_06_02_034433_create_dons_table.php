<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dons', function (Blueprint $table) {
            $table->id('id')->primary();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            // qr_code_scans is created later in migration order, keep the relation column without FK here.
            $table->foreignId('scan_id')->nullable();
            $table->timestamp('date_don');
            $table->enum('statut', ['valide', 'en_attente'])->default('en_attente');
            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('dons');
    }
};