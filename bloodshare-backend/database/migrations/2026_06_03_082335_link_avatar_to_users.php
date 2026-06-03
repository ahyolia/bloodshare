<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('avatar_url');
        $table->foreignId('avatar_id')
              ->nullable()
              ->after('pseudo')
              ->constrained('avatars')
              ->onDelete('set null');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropForeign(['avatar_id']);
        $table->dropColumn('avatar_id');
        $table->string('avatar_url')->nullable()->after('pseudo');
    });
}
};
