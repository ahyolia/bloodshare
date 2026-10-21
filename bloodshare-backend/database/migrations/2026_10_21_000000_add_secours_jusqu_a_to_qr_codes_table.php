<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // 📖 QR centre de secours (imprimé) : accepté seulement tant que cette date n'est pas
    //    passée, activé à la main dans le BO quand l'écran du centre ne marche pas.
    public function up(): void
    {
        Schema::table('qr_codes', function (Blueprint $table) {
            $table->timestamp('secours_jusqu_a')->nullable()->after('actif');
        });
    }

    public function down(): void
    {
        Schema::table('qr_codes', function (Blueprint $table) {
            $table->dropColumn('secours_jusqu_a');
        });
    }
};
