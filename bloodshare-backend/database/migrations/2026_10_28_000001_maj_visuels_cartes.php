<?php

use Database\Seeders\VisuelsSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    // 📖 Visuels redessinés (octobre à décembre, parrainage, forum, fidèle) et nouveaux mois
    //    (janvier à mars). VisuelsSeeder remplace les visuels par défaut encore en place et
    //    laisse les images envoyées depuis le BO.
    public function up(): void
    {
        (new VisuelsSeeder())->run();
    }

    public function down(): void
    {
        // Rien à défaire : les anciens fichiers ne sont plus versionnés, et le down de
        // seed_visuels_cartes_et_badges retire déjà tous les visuels par défaut.
    }
};
