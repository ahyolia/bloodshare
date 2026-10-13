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

    public function test_les_couleurs_aima_sont_appliquees(): void
    {
        $this->get(route('filament.admin.auth.login'))
            ->assertOk()
            // Boutons : corail foncé en clair (600) et en sombre (500), texte blanc lisible.
            ->assertSee('--primary-600:168, 59, 36', false)
            ->assertSee('--primary-500:191, 74, 48', false)
            // Mode clair : fond de page beige, en-têtes crème, textes aubergine.
            ->assertSee('background-color: #F6F1E4', false)
            ->assertSee('--gray-50: 250, 246, 238', false)
            ->assertSee('--gray-950: 62, 36, 48', false);
    }

    public function test_modifier_est_en_couleur_neutre_pour_ne_pas_ressembler_a_supprimer(): void
    {
        $this->assertSame('gray', \Filament\Tables\Actions\EditAction::make()->getColor());
        $this->assertSame('gray', \Filament\Actions\EditAction::make()->getColor());
        // Supprimer garde le rouge des actions destructrices.
        $this->assertSame('danger', \Filament\Tables\Actions\DeleteAction::make()->getColor());
    }

    public function test_les_fichiers_du_logo_existent(): void
    {
        // 📖 Le logo officiel remplacera ces fichiers sous le même nom : s'il en manque un,
        //    le BO afficherait une image cassée sans qu'aucune autre vérification ne le voie.
        foreach (['logo-aima.svg', 'logo-aima-sombre.svg', 'favicon-aima.png'] as $fichier) {
            $this->assertFileExists(public_path("images/branding/{$fichier}"));
        }
    }
}
