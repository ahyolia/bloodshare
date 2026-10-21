<?php

namespace Tests\Feature;

use App\Filament\Resources\CarteResource\Pages\CreateCarte;
use App\Filament\Resources\CarteResource\Pages\EditCarte;
use App\Models\Carte;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Imagick;
use ImagickPixel;
use Livewire\Livewire;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * 📖 Fichiers envoyés depuis le BO (badges, cartes, contenus, événements) : seules de vraies
 *    images légères sont acceptées, et elles sont réencodées avant d'être servies à l'app.
 *    Testé sur le formulaire des cartes, tous les champs image passant par ChampImage.
 */
class UploadImagesBackofficeTest extends TestCase
{
    use RefreshDatabase;

    private string $dossier;

    protected function setUp(): void
    {
        parent::setUp();

        if (! extension_loaded('imagick')) {
            $this->markTestSkipped('Extension imagick absente.');
        }

        Storage::fake('public');
        $this->dossier = sys_get_temp_dir() . '/upload-test-' . uniqid();
        mkdir($this->dossier);

        Role::findOrCreate('admin');
        $admin = User::factory()->create(['statut' => 'actif']);
        $admin->assignRole('admin');
        $this->actingAs($admin);
    }

    public function test_accepte_une_image_et_la_reencode_en_webp_reduit(): void
    {
        $this->creerCarte($this->image('photo.png', 3000, 2000))->assertHasNoFormErrors();

        $chemin = Carte::first()->getRawOriginal('image_url');
        $this->assertStringEndsWith('.webp', $chemin);

        $image = new Imagick();
        $image->readImageBlob(Storage::disk('public')->get($chemin));
        $this->assertSame('WEBP', $image->getImageFormat());
        $this->assertLessThanOrEqual(1600, max($image->getImageWidth(), $image->getImageHeight()));
    }

    public function test_supprime_le_contenu_cache_dans_une_image(): void
    {
        // 📖 Polyglotte : un vrai PNG qui transporte du code PHP dans ses métadonnées. Le
        //    réencodage ne garde que les pixels.
        $fichier = $this->image('piege.png', 400, 400, commentaire: '<?php system($_GET["c"]); ?>');

        $this->creerCarte($fichier)->assertHasNoFormErrors();

        $contenu = Storage::disk('public')->get(Carte::first()->getRawOriginal('image_url'));
        $this->assertStringNotContainsString('<?php', $contenu);
    }

    public function test_refuse_un_svg(): void
    {
        // 📖 Un SVG est du XML : il peut contenir du JavaScript exécuté à l'ouverture.
        $svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>';

        $this->creerCarte(UploadedFile::fake()->createWithContent('logo.svg', $svg))
            ->assertHasFormErrors(['image_url']);
    }

    public function test_refuse_un_fichier_php_deguise_en_image(): void
    {
        $fichier = $this->image('piege.png', 50, 50, commentaire: '<?php system($_GET["c"]); ?>');

        $this->creerCarte(UploadedFile::fake()->createWithContent('piege.php', $fichier->get()))
            ->assertHasFormErrors(['image_url']);
    }

    public function test_refuse_un_gif(): void
    {
        $this->creerCarte($this->image('anime.gif', 100, 100, format: 'gif'))->assertHasFormErrors(['image_url']);
    }

    public function test_refuse_une_image_de_plus_de_2_mo(): void
    {
        $fichier = $this->image('lourde.png', 1400, 1400, bruit: true);
        $this->assertGreaterThan(2 * 1024 * 1024, $fichier->getSize());

        $this->creerCarte($fichier)->assertHasFormErrors(['image_url']);
    }

    public function test_refuse_une_image_aux_dimensions_demesurees(): void
    {
        // 📖 Fichier léger (couleur unie) mais 5 000 px de côté : à 20 000 px, toujours léger,
        //    le décoder demanderait des Go de mémoire au serveur.
        $this->creerCarte($this->image('geante.png', 5000, 5000))->assertHasFormErrors(['image_url']);
    }

    public function test_l_edition_d_une_carte_avec_image_s_ouvre_toujours(): void
    {
        // 📖 Régression déjà vue (PR #74) : le champ image donnait une 500 à l'édition.
        $this->creerCarte($this->image('photo.png', 300, 300))->assertHasNoFormErrors();

        Livewire::test(EditCarte::class, ['record' => Carte::first()->getRouteKey()])
            ->assertOk()
            ->assertFormSet(['titre' => 'Carte test']);
    }

    private function creerCarte(UploadedFile $fichier)
    {
        return Livewire::test(CreateCarte::class)
            // 📖 set() champ par champ : fillForm() laissait le formulaire vide ici.
            ->set('data.titre', 'Carte test')
            ->set('data.categorie', 'evenement')
            ->set('data.statut', 'active')
            ->set('data.image_url', $fichier)
            ->call('create');
    }

    private function image(string $nom, int $largeur, int $hauteur, string $format = 'png', ?string $commentaire = null, bool $bruit = false): UploadedFile
    {
        $image = new Imagick();
        $image->newImage($largeur, $hauteur, new ImagickPixel('#A83B24'));

        if ($bruit) {
            $image->addNoiseImage(Imagick::NOISE_RANDOM);
        }

        if ($commentaire) {
            $image->commentImage($commentaire);
        }

        $image->setImageFormat($format);
        $chemin = "{$this->dossier}/{$nom}";
        $image->writeImage($chemin);

        return UploadedFile::fake()->createWithContent($nom, file_get_contents($chemin));
    }
}
