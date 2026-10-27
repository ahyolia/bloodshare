<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Carte;
use Database\Seeders\BadgeSeeder;
use Database\Seeders\CarteSeeder;
use Database\Seeders\VisuelsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VisuelsCartesBadgesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // 📖 La migration seed_visuels_cartes_et_badges a déjà posé des visuels (sur le vrai
        //    disque) : on repart de zéro, sur un disque factice, pour tester VisuelsSeeder seul.
        Storage::fake('public');
        $this->seed([CarteSeeder::class, BadgeSeeder::class]);
        Badge::query()->update(['image_url' => null]);
        Carte::query()->update(['image_url' => null]);
    }

    public function test_chaque_badge_recoit_son_visuel(): void
    {
        $this->seed(VisuelsSeeder::class);

        $sansVisuel = Badge::whereNull('image_url')->pluck('nom');
        $this->assertCount(0, $sansVisuel, 'Badges sans visuel : ' . $sansVisuel->implode(', '));

        Badge::all()->each(fn (Badge $badge) => Storage::disk('public')->assertExists($badge->getRawOriginal('image_url')));
    }

    public function test_les_cartes_illustrees_recoivent_leur_visuel(): void
    {
        $this->seed(VisuelsSeeder::class);

        foreach ([1, 2, 3, 10, 11, 12] as $mois) {
            $carte = Carte::where('categorie', 'mois_don')->where('mois_numero', $mois)->sole();
            $this->assertMatchesRegularExpression(sprintf('#^visuels/cartes/mois-%02d-[0-9a-f]{8}\.webp$#', $mois), $carte->getRawOriginal('image_url'));
            Storage::disk('public')->assertExists($carte->getRawOriginal('image_url'));
        }

        $parrain = Carte::where('categorie', 'parrain')->sole()->getRawOriginal('image_url');
        $this->assertMatchesRegularExpression('#^visuels/cartes/parrainage-[0-9a-f]{8}\.webp$#', $parrain);
        $this->assertSame($parrain, Carte::where('categorie', 'filleul')->sole()->getRawOriginal('image_url'));
        $this->assertMatchesRegularExpression('#^visuels/cartes/forum-iut-[0-9a-f]{8}\.webp$#', $this->carteForum()->getRawOriginal('image_url'));
        $this->assertMatchesRegularExpression('#^visuels/cartes/fidele-[0-9a-f]{8}\.webp$#', Carte::where('categorie', 'fidele')->sole()->getRawOriginal('image_url'));
    }

    public function test_les_mois_sans_visuel_gardent_le_placeholder(): void
    {
        $this->seed(VisuelsSeeder::class);

        $this->assertSame(6, Carte::where('categorie', 'mois_don')->whereNull('image_url')->count());
    }

    public function test_remplace_un_ancien_visuel_par_defaut_et_supprime_son_fichier(): void
    {
        // 📖 Base migrée avant que le visuel soit redessiné : l'ancien chemin sans empreinte.
        Storage::disk('public')->put('visuels/cartes/mois-11.webp', 'ancien');
        $carte = Carte::where('categorie', 'mois_don')->where('mois_numero', 11)->sole();
        $carte->forceFill(['image_url' => 'visuels/cartes/mois-11.webp'])->save();

        $this->seed(VisuelsSeeder::class);

        $nouveau = $carte->fresh()->getRawOriginal('image_url');
        $this->assertMatchesRegularExpression('#^visuels/cartes/mois-11-[0-9a-f]{8}\.webp$#', $nouveau);
        Storage::disk('public')->assertExists($nouveau);
        Storage::disk('public')->assertMissing('visuels/cartes/mois-11.webp');
    }

    public function test_relancer_le_seeder_ne_change_pas_les_chemins(): void
    {
        $this->seed(VisuelsSeeder::class);
        $avant = Carte::whereNotNull('image_url')->pluck('image_url', 'id');

        $this->seed(VisuelsSeeder::class);

        $this->assertEquals($avant, Carte::whereNotNull('image_url')->pluck('image_url', 'id'));
    }

    public function test_n_ecrase_pas_une_image_envoyee_depuis_le_backoffice(): void
    {
        $badge = Badge::where('nom', 'Premier Pas')->sole();
        $badge->update(['image_url' => 'badges/envoye-depuis-le-bo.webp']);

        $this->seed(VisuelsSeeder::class);

        $this->assertSame('badges/envoye-depuis-le-bo.webp', $badge->fresh()->getRawOriginal('image_url'));
    }

    public function test_relancer_les_seeders_ne_retire_pas_les_visuels(): void
    {
        $this->seed(VisuelsSeeder::class);
        $this->seed([CarteSeeder::class, BadgeSeeder::class]);

        $this->assertSame(0, Badge::whereNull('image_url')->count());
        $this->assertNotNull(Carte::where('categorie', 'parrain')->sole()->getRawOriginal('image_url'));
    }

    public function test_la_carte_du_forum_n_est_pas_generique_et_reste_distincte_de_la_generique(): void
    {
        // 📖 CarteSeeder retrouvait la carte Événement par sa seule catégorie : il aurait
        //    renommé la carte du forum en « Carte Événement ».
        $this->seed([VisuelsSeeder::class, CarteSeeder::class]);

        $this->assertFalse($this->carteForum()->generique);
        $this->assertSame('Carte Événement', Carte::generiqueEvenement()->titre);
    }

    private function carteForum(): Carte
    {
        return Carte::where('titre', VisuelsSeeder::TITRE_CARTE_FORUM)->sole();
    }
}
