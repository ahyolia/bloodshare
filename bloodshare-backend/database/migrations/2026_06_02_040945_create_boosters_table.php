<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boosters', function (Blueprint $table) {
            $table->id('id')->primary();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('scan_id')->constrained('qr_code_scans')->onDelete('cascade');
            $table->enum('source', ['don', 'evenement']);
            $table->enum('statut', ['non_ouvert', 'ouvert'])->default('non_ouvert');
            $table->timestamp('obtenu_at');
            $table->timestamp('ouvert_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boosters');
    }
};