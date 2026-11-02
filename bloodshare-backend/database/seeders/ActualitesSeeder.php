<?php

namespace Database\Seeders;

use App\Models\Contenu;
use App\Models\User;
use Illuminate\Database\Seeder;

// 📖 Actualités rédigées par l'équipe, publiées directement. Une actualité dont le titre
//    existe déjà n'est jamais modifiée : une fois insérée, c'est le backoffice qui fait foi.
//    Lancement : php artisan db:seed --class=ActualitesSeeder
//
//    Syntaxe du contenu, la même que pour les fiches pratiques : « ## Titre », « - » pour
//    une puce, une ligne vide entre deux paragraphes, « **texte** » pour du gras. L'API ne
//    renvoie pas de chapeau séparé : il est le premier paragraphe, en gras.
class ActualitesSeeder extends Seeder
{
    public function run(): void
    {
        // whereHas plutôt que User::role() : ce dernier lève une exception si le rôle
        // n'existe pas encore (base vide, tests).
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->first();

        foreach (self::actualites() as $actualite) {
            Contenu::firstOrCreate(
                ['type' => 'actualite', 'titre' => $actualite['titre']],
                [
                    'admin_id' => $admin?->id,
                    'contenu' => trim($actualite['contenu']),
                    'statut' => 'publie',
                    'published_at' => $actualite['published_at'],
                ]
            );
        }
    }

    /**
     * @return array<int, array{titre: string, contenu: string, published_at: string}>
     */
    public static function actualites(): array
    {
        return [
            [
                'titre' => 'Aïma et le don du sang à l\'honneur au Forum des projets tutorés',
                'published_at' => '2026-10-29 17:00:00',
                'contenu' => <<<'TXT'
**Jeudi 29 octobre 2026, au Forum des projets tutorés de l'Université de la Nouvelle-Calédonie (UNC), des étudiants du Bachelor Métiers du multimédia et de l'internet (MMI) et des licences professionnelles Communication audiovisuelle et numérique (CAN) et Métiers de l'internet et applications web (MIAW) ont présenté leurs projets pour l'Association des donneurs de sang bénévoles (ADSB-NC) et le Centre de don du sang (CDS).**

Depuis plusieurs années, l'Institut universitaire de technologie (IUT) de Nouvelle-Calédonie organise le Forum des projets tutorés, un événement pensé pour et par les étudiants afin de mieux connaître la Nouvelle-Calédonie et ses structures. Les étudiants y mettent en lumière leur créativité, leur savoir-faire et leur engagement en présentant une année de travaux innovants et interactifs.

## Valoriser et moderniser le don du sang

Cette année, le groupe BloodShare, composé de Camélia Amin Handoyo, Geneviève Mekenese, Hugo Galy et Emmy Vergé, avait pour mission de valoriser et de moderniser le don du sang en Nouvelle-Calédonie. Le groupe a présenté plusieurs réalisations :

- **Aïma**, une application pour les donneurs et les bénévoles, qui fait du don une expérience engageante, valorisante et communautaire grâce à un système de gamification.
- **« Ça dit quoi le sang ? »**, une vidéo à 360° qui explique le don du sang et répond aux préjugés avec humour.
- **Un jeu de réalité virtuelle**, dans lequel le joueur découvre les étapes du don du sang.

Des projets riches et originaux qui ont beaucoup plu au public. Ce forum a été un succès pour le groupe comme pour l'IUT.

## Merci !

Merci à l'ADSB-NC, au CDS et à l'IUT pour ce projet : nous sommes ravis d'avoir pu travailler ensemble pendant cette année.

Article écrit par le groupe BloodShare – Emmy Vergé
TXT,
            ],
        ];
    }
}
