<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandingBackofficeTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_page_de_connexion_affiche_le_nom_le_logo_et_le_favicon_aima(): void
    {
        $this->get(route('filament.admin.auth.login'))
            ->assertOk()
            ->assertSee('Aïma')
            ->assertSee('images/branding/logo-aima.svg', false)
            ->assertSee('images/branding/logo-aima-sombre.svg', false)
            ->assertSee('images/branding/favicon-aima.png', false);
    }

    public function test_les_fichiers_du_logo_existent(): void
    {
        // 📖 Le logo officiel remplacera ces fichiers sous le même nom : s'il en manque un,
        //    le BO afficherait une image cassée sans qu'aucune autre vérification ne le voie.
        foreach (['logo-aima.svg', 'logo-aima-sombre.svg', 'favicon-aima.svg', 'favicon-aima.png'] as $fichier) {
            $this->assertFileExists(public_path("images/branding/{$fichier}"));
        }
    }
}
