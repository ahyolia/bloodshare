<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// 📖 Les trois documents juridiques (CGU, politique de confidentialité, mentions légales)
//    sont créés ici une fois pour toutes, avec un contenu vide : le backoffice ne permet
//    que de les modifier, jamais d'en ajouter ou d'en supprimer. Tant que le contenu est
//    vide, l'API répond 404 et l'app affiche « bientôt disponible ».
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents_juridiques', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique();
            $table->string('titre');
            $table->text('contenu')->nullable();
            $table->string('version')->default('1.0');
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        DB::table('documents_juridiques')->insert([
            ['type' => 'cgu', 'titre' => "Conditions générales d'utilisation", 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'confidentialite', 'titre' => 'Politique de confidentialité', 'created_at' => now(), 'updated_at' => now()],
            ['type' => 'mentions_legales', 'titre' => 'Mentions légales', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('documents_juridiques');
    }
};
