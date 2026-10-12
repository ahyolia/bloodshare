<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 📖 Preuve du consentement (voir docs/Dossier juridique) : on garde la date et la version
//    des CGU acceptées, et séparément la date du consentement explicite au traitement des
//    données de santé (sexe + dates de don). Nullable : les comptes existants et les admins
//    n'ont rien accepté via l'inscription mobile.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cgu_version')->nullable()->after('doit_changer_mdp');
            $table->timestamp('cgu_acceptees_at')->nullable()->after('cgu_version');
            $table->timestamp('consentement_sante_at')->nullable()->after('cgu_acceptees_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cgu_version', 'cgu_acceptees_at', 'consentement_sante_at']);
        });
    }
};
