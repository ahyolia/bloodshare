<?php

namespace Database\Seeders;

use App\Models\Contenu;
use App\Models\Quiz;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// 📖 Quiz rédigés par Strat'Com, relus (fautes, faits, doublons) et alignés sur le
//    référentiel d'éligibilité de l'app (QuestionEligibiliteSeeder, critères CHT NC).
//    Insérés en brouillon : on les relit dans le backoffice avant de les activer.
//    Un quiz dont le titre existe déjà n'est jamais modifié : une fois inséré, c'est le
//    backoffice qui fait foi. Lancement : php artisan db:seed --class=QuizContenuSeeder
class QuizContenuSeeder extends Seeder
{
    public const CATEGORIE_ELIGIBILITE = 'Qui peut donner ?';

    public const CATEGORIE_DON = 'Le don du sang';

    public const CATEGORIE_CENTRE = "Le Centre et l'ADSB-NC";

    public function run(): void
    {
        foreach (self::quiz() as $donnees) {
            if (Quiz::where('titre', $donnees['titre'])->exists()) {
                continue;
            }

            DB::transaction(function () use ($donnees) {
                $quiz = Quiz::create([
                    'titre' => $donnees['titre'],
                    'description' => $donnees['description'],
                    'categorie' => $donnees['categorie'],
                    'aleatoire' => false,
                    'points_attribues' => 20,
                    // 📖 Brouillon : pas de notification « nouveau quiz » envoyée à tous
                    //    les utilisateurs avant la relecture.
                    'statut' => 'brouillon',
                ]);

                foreach ($donnees['questions'] as $index => $donneesQuestion) {
                    $question = $quiz->questions()->create([
                        'intitule' => $donneesQuestion['intitule'],
                        'type' => $donneesQuestion['type'] ?? 'unique',
                        'ordre' => $index + 1,
                        'aleatoire' => false,
                        'explication' => $donneesQuestion['explication'],
                        'contenu_id' => self::ficheId($donneesQuestion['fiche'] ?? null),
                    ]);

                    foreach ($donneesQuestion['reponses'] as $texte => $estCorrecte) {
                        $question->reponses()->create([
                            'texte' => $texte,
                            'est_correcte' => $estCorrecte,
                        ]);
                    }
                }
            });
        }
    }

    // 📖 Fiche liée retrouvée par son titre (les ids diffèrent d'un environnement à
    //    l'autre). Absente ou non publiée → pas de lien, à faire dans le backoffice.
    private static function ficheId(?string $titre): ?int
    {
        if ($titre === null) {
            return null;
        }

        return Contenu::where('type', 'fiche_info')
            ->where('statut', 'publie')
            ->where('titre', $titre)
            ->value('id');
    }

    /**
     * Réponses sous la forme texte => est_correcte.
     *
     * @return array<int, array{titre: string, description: string, categorie: string, questions: array<int, array<string, mixed>>}>
     */
    public static function quiz(): array
    {
        return [
            // ── Qui peut donner ? ───────────────────────────────────
            [
                'titre' => 'Les critères de base',
                'description' => 'Âge, alcool, règles, fièvre : les premières questions à se poser avant de donner.',
                'categorie' => self::CATEGORIE_ELIGIBILITE,
                'questions' => [
                    [
                        'intitule' => 'Quel âge faut-il avoir pour donner son sang ?',
                        'reponses' => [
                            'Entre 16 et 60 ans' => false,
                            'Entre 18 et 70 ans' => true,
                            "De 18 à 99 ans, tant qu'on tient debout" => false,
                        ],
                        'explication' => 'Il faut avoir entre 18 et 70 ans. Ces limites protègent la santé du donneur.',
                        'fiche' => 'Qui peut donner son sang ?',
                    ],
                    [
                        'intitule' => "J'ai bu de l'alcool hier soir. Puis-je donner mon sang aujourd'hui ?",
                        'reponses' => ['Oui' => false, 'Non' => true],
                        'explication' => "Non. Le Centre de don du sang demande de ne pas boire d'alcool dans les 72 heures (3 jours) avant le don. Cela protège ta santé et celle de la personne qui recevra ton sang.",
                    ],
                    [
                        'intitule' => 'Parmi ces situations, lesquelles empêchent de donner son sang pour le moment ?',
                        'type' => 'multiple',
                        'reponses' => [
                            'Une plaie encore ouverte' => true,
                            'Un furoncle (bouton infecté) pas encore guéri' => true,
                            'Une infection de la peau' => true,
                            'Une vieille cicatrice, bien refermée' => false,
                        ],
                        'explication' => "Une plaie, un furoncle ou une infection de la peau doivent être complètement guéris avant le don, même s'ils sont petits (une égratignure qui suinte, une griffure qui s'infecte…). Une ancienne cicatrice bien refermée ne pose aucun problème.",
                        'fiche' => 'Qui peut donner son sang ?',
                    ],
                    [
                        'intitule' => 'Peut-on donner son sang pendant ses règles ?',
                        'reponses' => ['Oui' => true, 'Non' => false],
                        'explication' => "Oui, les règles n'empêchent pas de donner. Si elles sont abondantes ou te fatiguent, choisis plutôt un jour où tu te sens en forme.",
                    ],
                    [
                        'intitule' => "Tu as de la fièvre et tu tousses depuis hier. Peux-tu donner ton sang aujourd'hui ?",
                        'reponses' => [
                            "Oui, ce n'est pas grave" => false,
                            "Non, il faut attendre d'être complètement guéri" => true,
                        ],
                        'explication' => 'La fièvre montre que ton corps combat une infection. Après une fièvre, une grippe, une gastro-entérite ou une infection, il faut attendre 15 jours après la disparition complète des symptômes avant de donner.',
                    ],
                ],
            ],
            [
                'titre' => 'Santé et délais à respecter',
                'description' => 'Grossesse, tatouage, opération : combien de temps attendre avant de donner ?',
                'categorie' => self::CATEGORIE_ELIGIBILITE,
                'questions' => [
                    [
                        'intitule' => 'Une personne qui a déjà reçu une transfusion sanguine peut-elle donner son sang ?',
                        'reponses' => ['Oui' => false, 'Non' => true],
                        'explication' => "Non. Les personnes qui ont reçu une transfusion ou une greffe ne peuvent pas donner leur sang. C'est une précaution pour ne pas transmettre, sans le savoir, une maladie qui n'aurait pas été détectée.",
                    ],
                    [
                        'intitule' => 'Une femme enceinte peut donner son sang si elle se sent en forme.',
                        'reponses' => ['Vrai' => false, 'Faux' => true],
                        'explication' => "Faux. Pendant la grossesse, le corps a besoin de toutes ses réserves, notamment en fer, pour la mère et le bébé. Le don est impossible pendant la grossesse et dans les 6 mois qui suivent l'accouchement.",
                    ],
                    [
                        'intitule' => 'Combien de temps faut-il attendre après un tatouage ou un piercing pour donner son sang ?',
                        'reponses' => ['15 jours' => false, '2 mois' => true, '6 mois' => false],
                        'explication' => "2 mois. Même dans un salon très propre, il existe un petit risque d'attraper un virus. Ce délai permet de vérifier que ce n'est pas le cas. Il peut évoluer avec les progrès des tests de dépistage.",
                    ],
                    [
                        'intitule' => 'Après une opération chirurgicale, combien de temps faut-il attendre avant de donner ?',
                        'reponses' => ['1 mois' => false, '2 mois' => false, '4 mois' => true],
                        'explication' => "4 mois. Une opération peut laisser entrer des bactéries ou des virus dans le corps. Ce délai permet de vérifier qu'aucune infection ne s'est développée. Il peut évoluer avec les progrès des tests de dépistage.",
                    ],
                    [
                        'intitule' => 'Parmi ces antécédents médicaux, lesquels empêchent de donner son sang ?',
                        'type' => 'multiple',
                        'reponses' => [
                            'Un infarctus (crise cardiaque)' => true,
                            'Un AVC (accident vasculaire cérébral)' => true,
                            'Un trouble du rythme cardiaque' => true,
                            'Une entorse de la cheville il y a 2 ans' => false,
                        ],
                        'explication' => "Les antécédents cardiaques ou neurologiques, comme l'infarctus, l'AVC ou les troubles du rythme cardiaque, empêchent le don : il pourrait être dangereux pour toi. Une ancienne entorse n'a aucun impact. En cas de doute, demande au personnel médical du Centre.",
                    ],
                ],
            ],
            [
                'titre' => 'Poids, voyages et mode de vie',
                'description' => 'Poids, surpoids, voyages, drogue, partenaires : ce qui compte vraiment.',
                'categorie' => self::CATEGORIE_ELIGIBILITE,
                'questions' => [
                    [
                        'intitule' => 'Quel est le poids minimum pour donner son sang ?',
                        'reponses' => ['40 kg' => false, '50 kg' => true, "Il n'y a pas de poids minimum" => false],
                        'explication' => "Il faut peser au moins 50 kg. Comme l'âge, le poids compte pour ta sécurité : la quantité de sang prélevée doit rester faible par rapport au volume de sang de ton corps.",
                        'fiche' => 'Qui peut donner son sang ?',
                    ],
                    [
                        'intitule' => 'Être en surpoids empêche-t-il de donner son sang ?',
                        'reponses' => ['Oui, toujours' => false, 'Non, pas en soi' => true],
                        'explication' => "Non. Il y a un poids minimum (50 kg), mais pas de poids maximum. Le surpoids ou un cholestérol surveillé n'empêchent pas le don en eux-mêmes. Le jour du don, un entretien avec un médecin vérifie que tu peux donner en toute sécurité.",
                    ],
                    [
                        'intitule' => "Ton retour d'un voyage dans une zone impaludée (une région où le paludisme est présent) date d'il y a 3 mois. Peux-tu donner ton sang aujourd'hui ?",
                        'reponses' => [
                            'Oui' => false,
                            'Non, il faut attendre 4 mois après le retour' => true,
                            'Non, il faut attendre 6 mois après le retour' => false,
                            "Oui, si je n'ai eu aucun symptôme" => false,
                        ],
                        'explication' => "Il faut attendre 4 mois après le retour d'une zone impaludée. Le paludisme est une maladie transmise par certains moustiques. Elle peut passer par le sang, même sans symptômes.",
                    ],
                    [
                        'intitule' => "Avoir consommé de la drogue par injection, même une seule fois, empêche-t-il de donner son sang ?",
                        'reponses' => [
                            'Oui, définitivement' => true,
                            "Non, il suffit d'attendre 72 heures" => false,
                            "Non, si c'était il y a longtemps" => false,
                        ],
                        'explication' => "Oui. Avoir consommé de la drogue par injection, même une seule fois, empêche définitivement de donner son sang, à cause du risque de maladies qui se transmettent par le sang (comme l'hépatite ou le VIH).",
                    ],
                    [
                        'intitule' => 'Une personne qui a eu un seul partenaire sexuel au cours des 4 derniers mois peut donner son sang.',
                        'reponses' => ['Vrai' => true, 'Faux' => false],
                        'explication' => "Vrai. Ce qui empêche le don pendant 4 mois, c'est d'avoir eu plus d'un partenaire sexuel sur cette période, même avec des rapports protégés.",
                    ],
                ],
            ],

            // ── Le don du sang ──────────────────────────────────────
            [
                'titre' => 'Idées reçues sur le don',
                'description' => 'Danger, groupes sanguins, réserves, rendez-vous : vrai ou faux ?',
                'categorie' => self::CATEGORIE_DON,
                'questions' => [
                    [
                        'intitule' => 'Donner son sang, est-ce dangereux pour la santé ?',
                        'reponses' => ['Oui' => false, 'Non' => true],
                        'explication' => "Non. Le matériel est stérile et à usage unique, et une équipe médicale t'accompagne du début à la fin. Un petit malaise ou un bleu au point de piqûre peuvent arriver, mais ils sont sans gravité.",
                        'fiche' => 'Comment se déroule un don de sang ?',
                    ],
                    [
                        'intitule' => 'Combien existe-t-il de groupes sanguins principaux ?',
                        'reponses' => ['4' => true, '5' => false, '6' => false],
                        'explication' => 'Il existe 4 groupes sanguins principaux : A, B, AB et O. On y ajoute le facteur Rhésus, positif (+) ou négatif (−). Cela donne 8 combinaisons, par exemple O+ ou AB−.',
                        'fiche' => 'Les différents groupes sanguins',
                    ],
                    [
                        'intitule' => 'En Nouvelle-Calédonie, les réserves de sang sont largement suffisantes.',
                        'reponses' => ['Vrai' => false, 'Faux' => true],
                        'explication' => "Faux. Les besoins sont importants en Nouvelle-Calédonie, notamment à cause des nombreux accidents de la route. Il n'y a jamais trop de sang en réserve : chaque don compte.",
                    ],
                    [
                        'intitule' => 'Faut-il obligatoirement prendre rendez-vous pour donner son sang ?',
                        'reponses' => [
                            "Oui, c'est obligatoire" => false,
                            'Non, il est impossible de prendre rendez-vous' => false,
                            "Non, mais c'est conseillé" => true,
                        ],
                        'explication' => "Ce n'est pas obligatoire, mais c'est conseillé pour éviter d'attendre. Tu peux prendre rendez-vous sur le site internet du Centre de don du sang de Nouvelle-Calédonie.",
                    ],
                    [
                        'intitule' => 'Quels sont les principaux composants du sang ?',
                        'type' => 'multiple',
                        'reponses' => [
                            'Les globules rouges' => true,
                            'Les globules blancs' => true,
                            'Les plaquettes' => true,
                            'Le plasma' => true,
                            'Du sirop de grenadine' => false,
                        ],
                        'explication' => "Le sang est composé de plasma (la partie liquide), de globules rouges (qui transportent l'oxygène), de globules blancs (qui défendent le corps contre les infections) et de plaquettes (qui aident à arrêter les saignements).",
                    ],
                ],
            ],
            [
                'titre' => 'Le jour du don',
                'description' => 'Quantité prélevée, préparation, anonymat : tout savoir avant de venir.',
                'categorie' => self::CATEGORIE_DON,
                'questions' => [
                    [
                        'intitule' => 'Combien de poches de sang sont utilisées chaque semaine en Nouvelle-Calédonie ?',
                        'reponses' => ['Entre 50 et 80' => false, 'Entre 80 et 130' => false, 'Entre 130 et 150' => true],
                        'explication' => "Entre 130 et 150 poches de sang sont utilisées chaque semaine, pour les naissances, les accidents ou les opérations. Pour suivre ce rythme, il faut des donneurs toute l'année.",
                    ],
                    [
                        'intitule' => "Quelle quantité de sang est prélevée lors d'un don ?",
                        'reponses' => ['Entre 300 et 500 ml' => true, 'Entre 1 et 1,5 litre' => false, '2 litres' => false],
                        'explication' => "Entre 300 et 500 ml, soit à peu près une bouteille d'eau de 50 cl. Ton corps contient environ 5 litres de sang et compense ce volume en quelques jours.",
                        'fiche' => 'Comment se déroule un don de sang ?',
                    ],
                    [
                        'intitule' => 'Avant de venir donner ton sang, que vaut-il mieux faire ?',
                        'reponses' => [
                            'Boire seulement un café bien serré juste avant' => false,
                            'Venir le ventre vide, sans avoir mangé ni bu' => false,
                            'Avoir bien mangé et bien bu dans les heures précédentes' => true,
                        ],
                        'explication' => "Il ne faut surtout pas venir à jeun ! Un repas normal et de l'eau dans la journée suffisent pour que ton corps soit en forme au moment du don.",
                        'fiche' => 'Que faire avant de donner son sang ?',
                    ],
                    [
                        'intitule' => 'Peux-tu savoir qui a reçu ton sang ?',
                        'reponses' => ['Oui' => false, 'Non' => true],
                        'explication' => "Non. Le don du sang est anonyme dans les deux sens : le receveur ne sait pas qui a donné, et le donneur ne sait pas qui a reçu. C'est l'un des grands principes du don, avec le bénévolat et la gratuité.",
                    ],
                    [
                        'intitule' => 'Pourquoi le don du sang est-il important ?',
                        'type' => 'multiple',
                        'reponses' => [
                            'Pour soigner des malades' => true,
                            'Pour permettre certaines opérations' => true,
                            'Pour le biscuit offert après le don' => false,
                        ],
                        'explication' => "Les dons servent à soigner les patients qui ont besoin d'une transfusion : opérations, maladies, accidents, accouchements… Le biscuit, c'est juste un bonus !",
                        'fiche' => 'Les bienfaits du don de sang',
                    ],
                ],
            ],
            [
                'titre' => 'Le parcours de ton sang',
                'description' => 'Analyse, compatibilité, conservation : que devient ton don ?',
                'categorie' => self::CATEGORIE_DON,
                'questions' => [
                    [
                        'intitule' => 'Que devient ton sang juste après le prélèvement ?',
                        'reponses' => [
                            'Il est tout de suite transfusé à un patient' => false,
                            "Il est analysé et préparé avant d'être utilisé" => true,
                            'Il est jeté' => false,
                        ],
                        'explication' => "Ton sang est d'abord analysé pour vérifier qu'il peut être transfusé sans risque, puis préparé avant d'être utilisé pour les patients.",
                        'fiche' => 'Comment se déroule un don de sang ?',
                    ],
                    [
                        'intitule' => "Pourquoi le groupe sanguin est-il important lors d'une transfusion ?",
                        'type' => 'multiple',
                        'reponses' => [
                            'Pour choisir un sang compatible avec celui du receveur' => true,
                            'Parce que tous les groupes sanguins sont compatibles entre eux' => false,
                            'Pour éviter une réaction dangereuse du corps du receveur' => true,
                            'Parce que le groupe sanguin décide de la quantité de sang prélevée' => false,
                        ],
                        'explication' => "Le sang donné doit être compatible avec celui du receveur. Sinon, son corps peut rejeter ce sang et réagir de façon dangereuse. C'est pour ça que le groupe sanguin est toujours vérifié.",
                        'fiche' => 'Les différents groupes sanguins',
                    ],
                    [
                        'intitule' => 'Le sang donné peut-il être séparé en plusieurs produits ?',
                        'reponses' => [
                            'Oui' => true,
                            'Non' => false,
                            'Seulement pour certains groupes sanguins' => false,
                            'Seulement quand le sang est rare' => false,
                        ],
                        'explication' => 'Oui. Un don de sang est séparé en globules rouges, plasma et plaquettes. Un seul don peut ainsi aider plusieurs patients !',
                    ],
                    [
                        'intitule' => 'Pourquoi faut-il donner son sang régulièrement ?',
                        'reponses' => [
                            'Parce que les produits sanguins ne se conservent pas longtemps' => false,
                            "Parce que les patients en ont besoin toute l'année" => false,
                            "Parce qu'on ne sait pas fabriquer du sang artificiellement" => false,
                            'Pour toutes ces raisons' => true,
                        ],
                        'explication' => "Les besoins existent toute l'année, les produits sanguins ne se conservent que peu de temps (quelques jours pour les plaquettes, quelques semaines pour les globules rouges) et on ne sait pas fabriquer du sang artificiellement. Les dons réguliers sont donc indispensables.",
                    ],
                    [
                        'intitule' => 'Combien de temps dure le prélèvement lui-même ?',
                        'reponses' => ['1 minute, top chrono' => false, 'Environ 10 minutes' => true, '1 heure' => false],
                        'explication' => "Le prélèvement dure environ 10 minutes. Avec l'accueil, l'entretien médical et la collation, compte moins d'une heure entre ton arrivée et ton départ.",
                        'fiche' => 'Comment se déroule un don de sang ?',
                    ],
                ],
            ],

            // ── Le Centre et l'ADSB-NC ──────────────────────────────
            [
                'titre' => 'Le Centre de don du sang',
                'description' => 'Bénévolat, collectes, ADSB-NC : qui fait quoi en Nouvelle-Calédonie ?',
                'categorie' => self::CATEGORIE_CENTRE,
                'questions' => [
                    [
                        'intitule' => "Donner son sang en Nouvelle-Calédonie, c'est…",
                        'reponses' => [
                            'Payé 5 000 F par don' => false,
                            'Bénévole et gratuit' => true,
                            'Réservé aux professionnels de santé' => false,
                        ],
                        'explication' => "Le don du sang est bénévole, gratuit et anonyme : personne n'est payé pour donner. C'est un geste solidaire !",
                    ],
                    [
                        'intitule' => 'Où peut-on aussi organiser des collectes de sang ?',
                        'type' => 'multiple',
                        'reponses' => [
                            'Dans les entreprises' => true,
                            'Dans les établissements scolaires' => true,
                            'Dans des collectivités ou des associations' => true,
                            'Au fond du lagon, en plongée' => false,
                        ],
                        'explication' => 'Des collectes peuvent être organisées dans des entreprises, des établissements scolaires, des collectivités ou des associations, pour permettre à plus de monde de donner près de chez soi.',
                    ],
                    [
                        'intitule' => 'Que signifie ADSB-NC ?',
                        'reponses' => [
                            'Association pour le Don et le Secours de la Brousse en Nouvelle-Calédonie' => false,
                            'Association des Donneurs de Sang Bénévoles de Nouvelle-Calédonie' => true,
                            'Association pour le Développement de la Santé et du Bien-être en Nouvelle-Calédonie' => false,
                        ],
                        'explication' => 'ADSB-NC signifie Association des Donneurs de Sang Bénévoles de Nouvelle-Calédonie. Elle fait la promotion du don du sang partout sur le territoire.',
                    ],
                    [
                        'intitule' => 'Le Centre de don du sang fournit des produits sanguins à quels territoires ?',
                        'reponses' => [
                            'La Nouvelle-Calédonie uniquement' => false,
                            'La Nouvelle-Calédonie et Wallis-et-Futuna' => true,
                            "La Nouvelle-Calédonie et l'Australie" => false,
                            'Toute la région Pacifique' => false,
                        ],
                        'explication' => 'Le Centre de don du sang a pour mission de fournir assez de produits sanguins pour la Nouvelle-Calédonie et Wallis-et-Futuna.',
                    ],
                    [
                        'intitule' => "Parmi ces événements, lesquels sont organisés ou soutenus par l'ADSB-NC ?",
                        'type' => 'multiple',
                        'reponses' => [
                            'Le Rallye 100 pour Sang' => true,
                            'La Goutte de Sang Géante' => true,
                            "Des stands d'information lors de manifestations locales" => true,
                            'Les Jeux du Pacifique' => false,
                        ],
                        'explication' => "L'ADSB-NC organise notamment le Rallye 100 pour Sang et la Goutte de Sang Géante, et tient des stands d'information lors de manifestations locales.",
                    ],
                ],
            ],
            [
                'titre' => "L'ADSB-NC et toi",
                'description' => "Contacter le Centre, rejoindre l'association, l'après-don.",
                'categorie' => self::CATEGORIE_CENTRE,
                'questions' => [
                    [
                        'intitule' => "Parmi ces actions, lesquelles sont réalisées par l'ADSB-NC ?",
                        'type' => 'multiple',
                        'reponses' => [
                            'Participer à des manifestations de sensibilisation' => true,
                            "Tenir des stands d'information" => true,
                            "Réaliser les transfusions à l'hôpital" => false,
                        ],
                        'explication' => "L'ADSB-NC participe à des manifestations de sensibilisation et tient des stands d'information. Les transfusions, elles, sont réalisées par le personnel médical de l'hôpital.",
                    ],
                    [
                        'intitule' => 'Quel numéro gratuit permet de contacter le Centre de don du sang ?',
                        'reponses' => ['15' => false, '17' => false, '055 100' => true, '18' => false],
                        'explication' => "Le 055 100 est le numéro gratuit du Centre de don du sang pour poser toutes tes questions. Le 15 (SAMU), le 17 (police) et le 18 (pompiers) sont des numéros d'urgence.",
                    ],
                    [
                        'intitule' => "Qui peut faire partie de l'ADSB-NC ?",
                        'reponses' => [
                            'Seulement les personnes qui donnent régulièrement leur sang' => false,
                            'Seulement les professionnels de santé' => false,
                            'Toute personne, donneuse ou non, qui veut promouvoir le don du sang' => true,
                            'Seulement les médecins' => false,
                        ],
                        'explication' => "L'ADSB-NC accueille toutes les personnes, donneuses ou non, qui veulent faire connaître le don du sang.",
                    ],
                    [
                        'intitule' => 'Que propose le Centre après le prélèvement ?',
                        'reponses' => [
                            'Une séance de sport intensive' => false,
                            'Un temps de repos, puis une collation' => true,
                            'Un repas complet obligatoire' => false,
                            'Rien, tu repars aussitôt' => false,
                        ],
                        'explication' => "Après le prélèvement, tu te reposes une dizaine de minutes, puis une collation t'est offerte pour reprendre des forces.",
                        'fiche' => 'Comment se déroule un don de sang ?',
                    ],
                    [
                        'intitule' => 'Quels établissements reçoivent les produits sanguins du service de transfusion ?',
                        'reponses' => [
                            'Uniquement le CHT Gaston-Bourret' => false,
                            'Uniquement les établissements publics' => false,
                            'Les établissements de soins publics et privés de Nouvelle-Calédonie et de Wallis-et-Futuna' => true,
                            'Uniquement les cliniques privées' => false,
                        ],
                        'explication' => 'Le service de transfusion sanguine approvisionne tous les établissements de soins, publics et privés, de Nouvelle-Calédonie et de Wallis-et-Futuna.',
                    ],
                ],
            ],
        ];
    }
}
