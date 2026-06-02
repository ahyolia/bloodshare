<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'prenom');
            $table->string('nom')->nullable()->after('prenom');
            $table->enum('sexe', ['homme', 'femme'])->nullable()->after('email');
            $table->enum('groupe_sanguin', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable()->after('sexe');
            $table->enum('statut', ['actif', 'suspendu', 'supprime'])->default('actif')->after('groupe_sanguin');
            $table->string('motif_suspension')->nullable()->after('statut');
            $table->integer('points_cumules')->default(0)->after('motif_suspension');
            $table->timestamp('derniere_connexion')->nullable()->after('points_cumules');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('prenom', 'name');
            $table->dropColumn([
                'nom',
                'sexe',
                'groupe_sanguin',
                'statut',
                'motif_suspension',
                'points_cumules',
                'derniere_connexion',
            ]);
        });
    }
};