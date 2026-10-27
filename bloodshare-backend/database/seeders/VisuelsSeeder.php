<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Carte;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * 📖 Visuels par défaut des cartes et des badges, versionnés dans database/visuels/
 *    (WebP déjà réduits, comme ceux que ChampImage produit pour un upload du BO).
 *    Chaque fichier est copié sur le disque `public`, là où Filament range ses uploads :
 *    l'image s'affiche et se remplace ensuite normalement depuis le backoffice.
 *
 *    On ne touche qu'aux `image_url` vides ou encore sur un visuel par défaut (`visuels/…`) :
 *    une image envoyée depuis le BO n'est jamais écrasée. Le nom publié porte l'empreinte
 *    du fichier : un visuel redessiné change d'URL et le cache de la PWA ne sert pas
 *    l'ancien. Lancé par les migrations seed_visuels_cartes_et_badges et
 *    maj_visuels_cartes (Dokploy et sae203 ne lancent pas les seeders) et par
 *    DatabaseSeeder, après CarteSeeder et BadgeSeeder, pour une base recréée de zéro.
 */
class VisuelsSeeder extends Seeder
{
    public const TITRE_CARTE_FORUM = 'Carte Forum IUT';

    /**
     * Collection (année) => carte de mois (mois_numero) => fichier dans database/visuels/cartes.
     * 📖 Pour une nouvelle collection : ses fichiers (ex. 2027/mois-01.webp), une entrée
     *    ici, et une migration qui relance ce seeder.
     */
    private const CARTES_MOIS = [
        2026 => [
            1 => 'mois-01.webp',
            2 => 'mois-02.webp',
            3 => 'mois-03.webp',
            10 => 'mois-10.webp',
            11 => 'mois-11.webp',
            12 => 'mois-12.webp',
        ],
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

        // 📖 Les migrations du 26 octobre lancent ce seeder avant que cartes.annee existe :
        //    il n'y avait alors qu'une collection, on ne filtre pas sur l'année.
        $parAnnee = Schema::hasColumn('cartes', 'annee');
        foreach (self::CARTES_MOIS as $annee => $fichiers) {
            foreach ($fichiers as $mois => $fichier) {
                Carte::where('categorie', 'mois_don')->where('mois_numero', $mois)
                    ->when($parAnnee, fn ($q) => $q->where('annee', $annee))
                    ->get()
                    ->each(fn (Carte $carte) => $this->attribuer($carte, "cartes/{$fichier}"));
            }
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
        $actuel = $modele->getRawOriginal('image_url');
        if ($actuel && ! str_starts_with($actuel, 'visuels/')) {
            return;
        }

        $contenu = file_get_contents(database_path("visuels/{$fichier}"));
        $empreinte = substr(md5($contenu), 0, 8);
        $chemin = 'visuels/' . preg_replace('/\.webp$/', "-{$empreinte}.webp", $fichier);
        if ($actuel === $chemin) {
            return;
        }

        $disque = Storage::disk('public');
        $disque->put($chemin, $contenu);
        $modele->forceFill(['image_url' => $chemin])->save();

        // L'ancien visuel par défaut, s'il n'est plus utilisé (parrain et filleul le partagent).
        if ($actuel && ! Carte::where('image_url', $actuel)->exists() && ! Badge::where('image_url', $actuel)->exists()) {
            $disque->delete($actuel);
        }
    }
}
