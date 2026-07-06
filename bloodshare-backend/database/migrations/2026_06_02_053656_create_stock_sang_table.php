<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_sang', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('groupe_sanguin', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
            $table->enum('niveau', ['critique', 'bas', 'correct', 'bon'])->default('correct');
            $table->timestamp('maj_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_sang');
    }
};