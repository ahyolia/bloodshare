<?php

namespace Tests\Unit;

use App\Services\NiveauService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

// 📖 NiveauService est un pur calcul (aucune base, aucun Laravel) : on étend directement
//    le TestCase de PHPUnit, ce qui rend ces tests quasi instantanés.
class NiveauServiceTest extends TestCase
{
    #[DataProvider('paliers')]
    public function test_attribue_le_bon_niveau_selon_les_points(int $points, int $niveau, string $label): void
    {
        $resultat = NiveauService::calculerNiveau($points);

        $this->assertSame($niveau, $resultat['niveau']);
        $this->assertSame($label, $resultat['label']);
        $this->assertSame($points, $resultat['points_actuels']);
    }

    public static function paliers(): array
    {
        return [
            'aucun point' => [0, 1, 'Curieux'],
            'juste sous Informé' => [99, 1, 'Curieux'],
            'pile Informé' => [100, 2, 'Informé'],
            'juste sous Engagé' => [299, 2, 'Informé'],
            'pile Engagé' => [300, 3, 'Engagé'],
            'pile Ambassadeur' => [600, 4, 'Ambassadeur'],
            'juste sous Héros' => [999, 4, 'Ambassadeur'],
            'pile Héros' => [1000, 5, 'Héros'],
            'bien au-delà de Héros' => [5000, 5, 'Héros'],
        ];
    }

    public function test_indique_le_seuil_du_niveau_suivant(): void
    {
        $this->assertSame(100, NiveauService::calculerNiveau(0)['points_prochain_niveau']);
        $this->assertSame(300, NiveauService::calculerNiveau(150)['points_prochain_niveau']);
        $this->assertSame(1000, NiveauService::calculerNiveau(600)['points_prochain_niveau']);
    }

    #[DataProvider('progressions')]
    public function test_calcule_la_progression_en_pourcentage_dans_le_palier(int $points, int $progression): void
    {
        $this->assertSame($progression, NiveauService::calculerNiveau($points)['progression']);
    }

    public static function progressions(): array
    {
        return [
            'début de palier' => [0, 0],
            'milieu du palier Curieux (0 → 100)' => [50, 50],
            'milieu du palier Informé (100 → 300)' => [200, 50],
            'arrondi au plus proche (300 → 600, 100 pts = 33,3 %)' => [400, 33],
            'fin de palier' => [99, 99],
        ];
    }

    public function test_le_niveau_maximum_n_a_pas_de_palier_suivant_et_est_complet(): void
    {
        $resultat = NiveauService::calculerNiveau(1500);

        $this->assertNull($resultat['points_prochain_niveau']);
        $this->assertSame(100, $resultat['progression']);
    }
}
