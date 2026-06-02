<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_code_scans', function (Blueprint $table) {
            $table->id('id')->primary();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('qr_code_id')->constrained('qr_codes')->onDelete('cascade');
            $table->integer('points_attribues')->default(0);
            $table->boolean('booster_attribue')->default(false);
            $table->timestamp('scanned_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_code_scans');
    }
};