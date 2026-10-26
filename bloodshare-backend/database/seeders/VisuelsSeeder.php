<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Carte;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * 📖 Visuels par défaut des cartes et des badges, versionnés dans database/visuels/
 *    (WebP déjà réduits, comme ceux que ChampImage produit pour un upload du BO).
 *    Chaque fichier est copié sur le disque `public`, là où Filament range ses uploads :
 *    l'image s'affiche et se remplace ensuite normalement depuis le backoffice.
 *
 *    On ne remplit que les `image_url` vides : une image déjà envoyée depuis le BO n'est
 *    jamais écrasée. Lancé par la migration seed_visuels_cartes_et_badges (Dokploy et
 *    sae203 ne lancent pas les seeders) et par DatabaseSeeder, après CarteSeeder et
 *    BadgeSeeder, pour une base recréée de zéro.
 */
class VisuelsSeeder extends Seeder
{
    public const TITRE_CARTE_FORUM = 'Carte Forum IUT';

    /** Carte de mois (mois_numero) => fichier dans database/visuels/cartes. */
    private const CARTES_MOIS = [
        10 => 'mois-10.webp',
        11 => 'mois-11.webp',
        12 => 'mois-12.webp',
    ];

    /** Catégorie de carte unique => fichier. Parrain et filleul partagent le même visuel. */
    private const CARTES_CATEGORIE = [
        'parrain' => 'parrainage.webp',
        'filleul' => 'parrainage.webp',
        'fidele' => 'fidele.webp',
    ];

    /** Nom du badge => fichier dans database/visuels/badges. */
    private const BADGES = [
        'Premier Pas' => 'premier-pas.webp',
        'Donneur Confirmé' => 'donneur-confirme.webp',
        'Fidèle au Don' => 'fidele-au-don.webp',
        'Compagnon de route' => 'compagnon-de-route.webp',
        'Grain de curiosité' => 'grain-de-curiosite.webp',
        'Bien entouré' => 'bien-entoure.webp',
        'Bien accueilli' => 'bien-accueilli.webp',
        'Ambassadeur' => 'ambassadeur.webp',
        'Quiz Master' => 'quiz-master.webp',
        'Incollable' => 'incollable.webp',
        'Belle collection' => 'belle-collection.webp',
        'Année complète' => 'annee-complete.webp',
        'Toujours partant' => 'toujours-partant.webp',
        "Esprit d'équipe" => 'esprit-d-equipe.webp',
        'Objectif atteint' => 'objectif-atteint.webp',
    ];

    public function run(): void
    {
        // 📖 Carte propre au forum des projets tutorés : elle n'est remise que par
        //    l'événement qui la désigne (evenements.carte_id), jamais comme carte générique.
        $carteForum = Carte::firstOrCreate(
            ['categorie' => 'evenement', 'titre' => self::TITRE_CARTE_FORUM],
            [
                'description' => 'Carte obtenue au forum des projets tutorés de l\'IUT',
                'statut' => 'active',
                'generique' => false,
            ]
        );
        $this->attribuer($carteForum, 'cartes/forum-iut.webp');

        foreach (self::CARTES_MOIS as $mois => $fichier) {
            Carte::where('categorie', 'mois_don')->where('mois_numero', $mois)->get()
                ->each(fn (Carte $carte) => $this->attribuer($carte, "cartes/{$fichier}"));
        }

        foreach (self::CARTES_CATEGORIE as $categorie => $fichier) {
            Carte::where('categorie', $categorie)->get()
                ->each(fn (Carte $carte) => $this->attribuer($carte, "cartes/{$fichier}"));
        }

        foreach (self::BADGES as $nom => $fichier) {
            Badge::where('nom', $nom)->get()
                ->each(fn (Badge $badge) => $this->attribuer($badge, "badges/{$fichier}"));
        }
    }

    private function attribuer(Carte|Badge $modele, string $fichier): void
    {
        // getRawOriginal : l'accesseur image_url renvoie une URL absolue, pas la valeur en base.
        if ($modele->getRawOriginal('image_url')) {
            return;
        }

        $chemin = "visuels/{$fichier}";
        Storage::disk('public')->put($chemin, file_get_contents(database_path("visuels/{$fichier}")));

        $modele->forceFill(['image_url' => $chemin])->save();
    }
}
