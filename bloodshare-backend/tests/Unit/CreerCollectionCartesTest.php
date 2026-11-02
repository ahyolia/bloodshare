<?php

namespace Tests\Unit;

use App\Models\Carte;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreerCollectionCartesTest extends TestCase
{
    use RefreshDatabase;

    public function test_cree_par_defaut_la_collection_de_l_annee_suivante(): void
    {
        $this->travelTo(now()->setDate(2026, 12, 1));

        $this->artisan('cartes:creer-collection')->assertSuccessful();

        $cartes = Carte::where('categorie', 'mois_don')->where('annee', 2027)->orderBy('mois_numero')->get();
        $this->assertSame(range(1, 12), $cartes->pluck('mois_numero')->all());
        $this->assertSame('Carte de Janvier 2027', $cartes->first()->titre);
        $this->assertNull($cartes->first()->getRawOriginal('image_url'));
    }

    public function test_ne_recree_pas_une_carte_deja_preparee(): void
    {
        $preparee = Carte::create(['titre' => 'Mon dessin de mars', 'categorie' => 'mois_don', 'mois_numero' => 3, 'annee' => 2027, 'statut' => 'active']);

        $this->artisan('cartes:creer-collection', ['annee' => 2027])->assertSuccessful();
        $this->artisan('cartes:creer-collection', ['annee' => 2027])->assertSuccessful();

        $this->assertSame(12, Carte::where('categorie', 'mois_don')->where('annee', 2027)->count());
        $this->assertSame('Mon dessin de mars', $preparee->fresh()->titre);
    }

    public function test_refuse_une_annee_avant_la_premiere_collection(): void
    {
        $this->artisan('cartes:creer-collection', ['annee' => 2025])->assertFailed();
    }

    public function test_une_seule_carte_par_mois_et_par_annee(): void
    {
        Carte::create(['titre' => 'Mars', 'categorie' => 'mois_don', 'mois_numero' => 3, 'annee' => 2027, 'statut' => 'active']);

        $this->expectException(QueryException::class);
        Carte::create(['titre' => 'Mars bis', 'categorie' => 'mois_don', 'mois_numero' => 3, 'annee' => 2027, 'statut' => 'active']);
    }

    public function test_une_carte_de_mois_sans_annee_prend_l_annee_en_cours(): void
    {
        $this->travelTo(now()->setDate(2027, 5, 2));

        $carte = Carte::create(['titre' => 'Mai', 'categorie' => 'mois_don', 'mois_numero' => 5, 'statut' => 'active']);

        $this->assertSame(2027, $carte->annee);
    }
}
