<?php

namespace Database\Seeders;

use App\Models\Contenu;
use App\Models\User;
use Illuminate\Database\Seeder;

// 📖 Fiches pratiques de la page Don, rédigées à partir des critères officiels du Don du
//    Sang et des informations déjà utilisées dans les quiz (QuizContenuSeeder) : à faire
//    relire par Strat'Com. Une fiche existante est retrouvée par son titre et mise à jour ;
//    ensuite le backoffice fait foi. Lancement :
//    php artisan db:seed --class=FichesPratiquesSeeder
//
//    Syntaxe du contenu, la même que pour les documents juridiques : « ## Titre », « - »
//    pour une puce, une ligne vide entre deux paragraphes, « **texte** » pour du gras.
class FichesPratiquesSeeder extends Seeder
{
    /** Ancienne fiche de démonstration, remplacée par « Pourquoi donner régulièrement ? ». */
    private const FICHE_REMPLACEE = 'Les bienfaits du don de sang';

    public function run(): void
    {
        // whereHas plutôt que User::role() : ce dernier lève une exception si le rôle
        // n'existe pas encore (base vide, tests).
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->first();

        foreach (self::fiches() as $ordre => $fiche) {
            Contenu::updateOrCreate(
                ['type' => 'fiche_info', 'titre' => $fiche['titre']],
                [
                    'admin_id' => $admin?->id,
                    'categorie' => $fiche['categorie'],
                    'contenu' => trim($fiche['contenu']),
                    'le_saviez_vous' => $fiche['le_saviez_vous'],
                    'quiz_cta' => true,
                    'statut' => 'publie',
                    // 📖 L'API trie les fiches par date de publication : on fixe l'ordre de lecture.
                    'published_at' => now()->startOfDay()->addMinutes($ordre),
                ]
            );
        }

        // L'ancienne fiche de démo n'est retirée que si personne ne l'a réécrite dans le BO.
        Contenu::where('type', 'fiche_info')
            ->where('titre', self::FICHE_REMPLACEE)
            ->where('contenu', 'like', 'Lorem ipsum%')
            ->update(['statut' => 'brouillon']);

        $relies = QuizContenuSeeder::relierFiches();
        $this->command?->info("Fiches pratiques à jour, {$relies} question(s) de quiz reliée(s).");
    }

    /**
     * @return array<int, array{titre: string, categorie: string, contenu: string, le_saviez_vous: string}>
     */
    public static function fiches(): array
    {
        return [
            // ── Éligibilité au don ──────────────────────────────────
            [
                'titre' => 'Qui peut donner son sang ?',
                'categorie' => 'eligibilite',
                'contenu' => <<<'TXT'
Beaucoup de personnes peuvent donner leur sang. Quelques conditions protègent ta santé et celle des patients qui recevront ton sang.

## Les conditions de base
- **Avoir entre 18 et 70 ans.**
- **Peser au moins 50 kg.** Il n'y a pas de poids maximum.
- **Être en bonne santé** le jour du don, sans fièvre ni infection.

## Ce qui empêche de donner définitivement
- Avoir reçu une transfusion sanguine ou une greffe.
- Avoir consommé de la drogue par injection, même une seule fois.
- Certains antécédents cardiaques ou neurologiques, comme un infarctus, un AVC ou des troubles du rythme cardiaque.

## Le jour du don
Un médecin du Centre de don du sang fait le point avec toi, en toute confidentialité, pour vérifier que le don est possible. En cas de doute, c'est lui qui décide.

## Tu hésites ?
Fais le test « Suis-je éligible ? » dans l'onglet Don, ou appelle le **055 100**, le numéro gratuit du Centre de don du sang.
TXT,
                'le_saviez_vous' => "Les règles n'empêchent pas de donner son sang. Si elles te fatiguent, choisis simplement un jour où tu te sens en forme.",
            ],
            [
                'titre' => 'Les délais à respecter',
                'categorie' => 'eligibilite',
                'contenu' => <<<'TXT'
Certaines situations n'empêchent pas de donner, mais demandent d'attendre un peu. Ces délais laissent le temps de vérifier qu'aucune infection ne peut passer par le sang.

## Après une maladie
- **Fièvre, grippe, gastro-entérite ou infection** : 15 jours après la disparition complète des symptômes.
- **Plaie, furoncle ou infection de la peau** : attendre qu'ils soient complètement guéris, même s'ils sont petits.

## Après un soin ou un tatouage
- **Tatouage ou piercing** : 2 mois.
- **Opération chirurgicale** : 4 mois.

## Grossesse
- Pas de don pendant la grossesse, ni dans les **6 mois** qui suivent l'accouchement.

## Mode de vie
- **Alcool** : pas d'alcool dans les **72 heures** (3 jours) avant le don.
- **Plus d'un partenaire sexuel** au cours des 4 derniers mois : attendre 4 mois, même avec des rapports protégés.

## Voyages
- Retour d'une zone impaludée : **4 mois**. Tous les détails sont dans la fiche « Voyages et zones impaludées ».

Ces délais peuvent évoluer avec les progrès des tests de dépistage. Le jour du don, le médecin fait le point avec toi.
TXT,
                'le_saviez_vous' => "Une fois le délai passé, un tatouage ou un piercing n'empêche plus du tout de donner son sang.",
            ],
            [
                'titre' => 'Voyages et zones impaludées',
                'categorie' => 'eligibilite',
                'contenu' => <<<'TXT'
Tu reviens de voyage ? Selon ta destination, il faut parfois attendre avant de donner ton sang.

## Qu'est-ce qu'une zone impaludée ?
C'est une région où le **paludisme** est présent. Cette maladie est transmise par certains moustiques. Elle peut passer par le sang, même quand la personne n'a aucun symptôme.

## Le délai à respecter
- Après un séjour dans une zone impaludée, attends **4 mois après ton retour** avant de donner.

## Comment savoir si ta destination est concernée ?
- Le jour du don, le médecin te demande où tu as voyagé. Il sait quelles régions sont concernées.
- Avant de venir, tu peux poser la question au Centre de don du sang au **055 100**.
TXT,
                'le_saviez_vous' => "Le paludisme n'est pas présent en Nouvelle-Calédonie, mais il l'est dans plusieurs pays voisins du Pacifique.",
            ],

            // ── Processus du don ────────────────────────────────────
            [
                'titre' => 'Comment se déroule un don de sang ?',
                'categorie' => 'processus_don',
                'contenu' => <<<'TXT'
Entre ton arrivée et ton départ, compte moins d'une heure. Voici les étapes.

## 1. L'accueil
On t'accueille et on enregistre ta venue. Prendre rendez-vous n'est pas obligatoire, mais ça t'évite d'attendre.

## 2. L'entretien médical
Tu remplis un questionnaire, puis un médecin vérifie avec toi, en toute confidentialité, que tu peux donner.

## 3. Le prélèvement
- Il dure **environ 10 minutes**.
- On prélève **entre 300 et 500 ml** de sang, à peu près une bouteille d'eau de 50 cl. Ton corps en contient environ 5 litres et compense ce volume en quelques jours.
- Le matériel est **stérile et à usage unique**.

## 4. Le repos et la collation
Tu te reposes une dizaine de minutes, puis une collation t'est offerte pour reprendre des forces.

## Et ton sang ?
Il est analysé pour vérifier qu'il peut être transfusé sans risque, puis séparé en plusieurs produits : globules rouges, plasma et plaquettes. Un seul don peut ainsi aider plusieurs patients.
TXT,
                'le_saviez_vous' => "Le don est anonyme dans les deux sens : tu ne sauras pas qui a reçu ton sang, et le receveur ne saura pas qui le lui a donné.",
            ],
            [
                'titre' => 'Les différents groupes sanguins',
                'categorie' => 'processus_don',
                'contenu' => <<<'TXT'
Ton groupe sanguin ne change pas au cours de ta vie. Il compte beaucoup au moment d'une transfusion.

## 4 groupes, 8 combinaisons
- Il existe 4 groupes principaux : **A, B, AB et O**.
- On y ajoute le **facteur Rhésus** : positif (+) ou négatif (−).
- Cela donne 8 combinaisons, par exemple O+ ou AB−.

## Pourquoi c'est important ?
Le sang transfusé doit être **compatible** avec celui du receveur. Sinon, son corps peut le rejeter et réagir de façon dangereuse. C'est pour ça que le groupe sanguin est toujours vérifié avant une transfusion.

## De quoi est fait le sang ?
- **Le plasma**, la partie liquide.
- **Les globules rouges**, qui transportent l'oxygène.
- **Les globules blancs**, qui défendent le corps contre les infections.
- **Les plaquettes**, qui aident à arrêter les saignements.
TXT,
                'le_saviez_vous' => "En urgence, les globules rouges du groupe O− peuvent être transfusés à presque tout le monde : on l'appelle souvent le « donneur universel ».",
            ],

            // ── Avant et après le don ───────────────────────────────
            [
                'titre' => 'Que faire avant de donner son sang ?',
                'categorie' => 'apres_don',
                'contenu' => <<<'TXT'
Quelques gestes simples pour que ton don se passe bien.

## La veille et le jour même
- **Mange normalement.** Il ne faut surtout pas venir à jeun.
- **Bois de l'eau** dans la journée.
- **Pas d'alcool** dans les 72 heures avant le don.

## Avant de partir
- Vérifie que tu remplis les conditions avec le test « Suis-je éligible ? ».
- **Prends rendez-vous** sur le site du Centre de don du sang pour éviter d'attendre. Ce n'est pas obligatoire.

## Sur place
Prévois moins d'une heure en tout. Signale au médecin tout ce qui a changé récemment : un voyage, un soin, un traitement…
TXT,
                'le_saviez_vous' => "Un vrai repas avant de venir aide ton corps à bien supporter le don et limite le risque de petit malaise.",
            ],
            [
                'titre' => 'Après le don : bien récupérer',
                'categorie' => 'apres_don',
                'contenu' => <<<'TXT'
Ton corps compense le volume de sang prélevé en quelques jours. Voici comment l'aider.

## Juste après
- Reste te reposer une dizaine de minutes et profite de la collation offerte.
- Garde ton pansement quelques heures.

## Le reste de la journée
- **Bois plus** que d'habitude.
- **Évite les efforts intenses** et le sport.
- Si tu sens un petit malaise, **allonge-toi** en surélevant les jambes, et préviens quelqu'un.

## Un bleu au point de piqûre ?
C'est sans gravité : il disparaît en quelques jours.

## Une question après ton don ?
Appelle le Centre de don du sang au **055 100**, le numéro gratuit. Préviens-le aussi si tu tombes malade dans les jours qui suivent : c'est important pour la sécurité des patients.
TXT,
                'le_saviez_vous' => 'Un seul don peut être séparé en plusieurs produits sanguins, et donc aider plusieurs patients.',
            ],

            // ── Urgences et pénuries ────────────────────────────────
            [
                'titre' => 'Pourquoi donner régulièrement ?',
                'categorie' => 'urgences',
                'contenu' => <<<'TXT'
Les besoins en sang ne s'arrêtent jamais. Voici pourquoi chaque don compte, toute l'année.

## Des besoins chaque semaine
- En Nouvelle-Calédonie, **130 à 150 poches** de sang sont utilisées chaque semaine.
- Elles servent aux **naissances, aux opérations, aux maladies et aux accidents**, notamment ceux de la route.

## Le sang se conserve peu de temps
- Quelques **jours** pour les plaquettes.
- Quelques **semaines** pour les globules rouges.
- On ne sait pas fabriquer de sang artificiel : seuls les donneurs peuvent le remplacer.

## Tout un territoire à approvisionner
Le Centre de don du sang fournit les produits sanguins de toute la Nouvelle-Calédonie et de Wallis-et-Futuna.

## Un geste solidaire
Le don est **bénévole, gratuit et anonyme**. Un seul don peut aider plusieurs patients.
TXT,
                'le_saviez_vous' => "Tu peux suivre le niveau des réserves de chaque groupe sanguin sur la page d'accueil de l'app.",
            ],
        ];
    }
}
