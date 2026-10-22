<?php

namespace Tests\Feature;

use App\Filament\Resources\CarteResource\Pages\CreateCarte;
use App\Models\Contenu;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * 📖 Textes affichés dans le BO (audit cybersécurité). Le pseudo est le vecteur réaliste :
 *    n'importe qui peut s'inscrire et le choisir, puis un admin l'affiche dans le BO. Filament
 *    échappe tout par défaut ; ces tests bloquent un futur ->html() sur ces colonnes.
 */
class TextesBackofficeTest extends TestCase
{
    use RefreshDatabase;

    private const SCRIPT = '<script>alert(document.cookie)</script>';

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('admin');
        $admin = User::factory()->create(['statut' => 'actif']);
        $admin->assignRole('admin');
        $this->actingAs($admin);
    }

    public function test_le_pseudo_d_un_donneur_est_echappe_dans_la_liste_et_la_fiche(): void
    {
        $donneur = User::factory()->create(['pseudo' => self::SCRIPT, 'statut' => 'actif']);

        $this->get('/admin/users')->assertOk()->assertDontSee(self::SCRIPT, false)->assertSee(e(self::SCRIPT), false);
        $this->get("/admin/users/{$donneur->id}")->assertOk()->assertDontSee(self::SCRIPT, false);
    }

    public function test_le_titre_d_un_contenu_est_echappe_dans_la_liste(): void
    {
        Contenu::create(['type' => 'actualite', 'titre' => self::SCRIPT, 'contenu' => 'Texte', 'statut' => 'publie']);

        $this->get('/admin/contenus')->assertOk()->assertDontSee(self::SCRIPT, false)->assertSee(e(self::SCRIPT), false);
    }

    public function test_l_api_renvoie_le_texte_brut_sans_l_interpreter(): void
    {
        // 📖 L'app l'affiche dans des <Text> (React Native / React Native Web) : aucun HTML
        //    n'y est interprété, le texte doit donc arriver tel que saisi.
        Contenu::create(['type' => 'actualite', 'titre' => 'Titre', 'contenu' => self::SCRIPT, 'statut' => 'publie', 'published_at' => now()]);

        $this->getJson('/api/actualites')->assertOk()->assertJsonFragment(['contenu' => self::SCRIPT]);
    }

    public function test_refuse_une_description_trop_longue(): void
    {
        Livewire::test(CreateCarte::class)
            ->set('data.titre', 'Carte test')
            ->set('data.categorie', 'evenement')
            ->set('data.statut', 'active')
            ->set('data.description', str_repeat('a', 1001))
            ->call('create')
            ->assertHasFormErrors(['description' => 'max']);
    }
}
