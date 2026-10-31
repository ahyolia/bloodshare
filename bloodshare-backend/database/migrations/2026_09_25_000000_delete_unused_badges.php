<?php

use App\Models\Badge;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 📖 « Collection en cours » (six_cartes_mois) et « Défi du mois »
        //    (premier_defi_contribue) avaient été seedés mais ne sont vérifiés nulle part dans
        //    le code : jamais attribuables. Retirés du catalogue produit (revue @nevizsh).
        //    En migration et non dans le seeder : entrypoint.sh ne lance les seeders que si
        //    RUN_SEEDERS=true (jamais sur Dokploy) — le seeder seul n'aurait jamais nettoyé
        //    ces deux lignes en production.
        Badge::whereIn('nom', ['Collection en cours', 'Défi du mois'])->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Badge::insert([
            [
                'nom' => 'Collection en cours',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'six_cartes_mois',
                'image_url' => null,
                'statut' => 'actif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nom' => 'Défi du mois',
                'condition_type' => 'action_specifique',
                'condition_valeur' => null,
                'action_specifique' => 'premier_defi_contribue',
                'image_url' => null,
                'statut' => 'actif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
};
