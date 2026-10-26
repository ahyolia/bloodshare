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

        foreach ([10, 11, 12] as $mois) {
            $carte = Carte::where('categorie', 'mois_don')->where('mois_numero', $mois)->sole();
            Storage::disk('public')->assertExists($carte->getRawOriginal('image_url'));
        }

        $this->assertSame('visuels/cartes/parrainage.webp', Carte::where('categorie', 'parrain')->sole()->getRawOriginal('image_url'));
        $this->assertSame('visuels/cartes/parrainage.webp', Carte::where('categorie', 'filleul')->sole()->getRawOriginal('image_url'));
        $this->assertSame('visuels/cartes/forum-iut.webp', $this->carteForum()->getRawOriginal('image_url'));
        $this->assertSame('visuels/cartes/fidele.webp', Carte::where('categorie', 'fidele')->sole()->getRawOriginal('image_url'));
    }

    public function test_les_mois_sans_visuel_gardent_le_placeholder(): void
    {
        $this->seed(VisuelsSeeder::class);

        $this->assertSame(9, Carte::where('categorie', 'mois_don')->whereNull('image_url')->count());
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
