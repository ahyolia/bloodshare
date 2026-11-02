<?php

namespace Database\Seeders;

use App\Models\QuestionEligibilite;
use Illuminate\Database\Seeder;

// 📖 Les 15 critères de la liste officielle du Don du Sang, identiques à ceux de l'app
//    (bloodshare-mobile/constants/eligibilite.ts) : modifier les deux ensemble. Pas de
//    colonne pour les exemples : ils sont repris entre parenthèses dans la question.
//    Le message de refus est le motif affiché sous « un délai est habituellement
//    nécessaire » : jamais de verdict définitif, seuls les médecins du Don du Sang décident.
class QuestionEligibiliteSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            [
                'ordre' => 1,
                'question' => 'As-tu entre 18 et 70 ans ?',
                'reponse_bloquante' => 'non',
                'message_refus' => 'Le don du sang est possible de 18 à 70 ans.',
            ],
            [
                'ordre' => 2,
                'question' => 'Pèses-tu plus de 50 kg ?',
                'reponse_bloquante' => 'non',
                'message_refus' => 'Il faut peser plus de 50 kg pour donner son sang.',
            ],
            [
                'ordre' => 3,
                'question' => "Es-tu en bonne santé aujourd'hui ?",
                'reponse_bloquante' => 'non',
                'message_refus' => 'Il faut être en bonne santé le jour du don.',
            ],
            [
                'ordre' => 4,
                'question' => 'Es-tu enceinte, ou as-tu accouché dans les 6 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => "Le don n'est pas possible pendant la grossesse, ni dans les 6 mois qui suivent l'accouchement.",
            ],
            [
                'ordre' => 5,
                'question' => 'As-tu eu de la fièvre ou une infection dans les 15 derniers jours ? (grippe, gastro-entérite, bronchite, infection urinaire…)',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Il faut attendre 15 jours après la disparition complète des symptômes.',
            ],
            [
                'ordre' => 6,
                'question' => "As-tu une plaie, une blessure ou une infection de la peau qui n'est pas encore cicatrisée ? (furoncle, égratignure qui suinte…)",
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Il faut attendre que la peau soit complètement cicatrisée.',
            ],
            [
                'ordre' => 7,
                'question' => "As-tu déjà reçu une transfusion sanguine ou une greffe ? (quelle qu'en soit la date)",
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Une transfusion ou une greffe, même ancienne, est à signaler au Don du Sang.',
            ],
            [
                'ordre' => 8,
                'question' => 'As-tu des antécédents cardiaques ou neurologiques ? (infarctus, trouble du rythme, valvulopathie, AVC…)',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Les antécédents cardiaques ou neurologiques sont à voir avec un médecin du Don du Sang.',
            ],
            [
                'ordre' => 9,
                'question' => 'As-tu déjà eu un cancer ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Un antécédent de cancer est à voir avec un médecin du Don du Sang.',
            ],
            [
                'ordre' => 10,
                'question' => 'As-tu eu une fibroscopie ou une coloscopie dans les 2 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Il faut attendre 2 mois après une fibroscopie ou une coloscopie.',
            ],
            [
                'ordre' => 11,
                'question' => 'As-tu subi une opération chirurgicale dans les 4 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Il faut attendre 4 mois après une opération.',
            ],
            [
                'ordre' => 12,
                'question' => "As-tu fait un tatouage ou un piercing dans les 2 derniers mois ? (y compris maquillage permanent et trous d'oreilles)",
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Il faut attendre 2 mois après un tatouage ou un piercing.',
            ],
            [
                'ordre' => 13,
                'question' => "As-tu eu plus d'un partenaire sexuel dans les 4 derniers mois ? (même avec des rapports protégés)",
                'reponse_bloquante' => 'oui',
                'message_refus' => "Il faut attendre 4 mois après avoir eu plus d'un partenaire sexuel.",
            ],
            [
                'ordre' => 14,
                'question' => 'As-tu voyagé dans une zone impaludée dans les 4 derniers mois ? (zone où le paludisme est présent : Vanuatu, Afrique, Asie du Sud-Est, Amérique centrale ou du Sud)',
                'reponse_bloquante' => 'oui',
                'message_refus' => "Il faut attendre 4 mois après le retour d'une zone impaludée.",
            ],
            [
                'ordre' => 15,
                'question' => "As-tu bu de l'alcool ou consommé de la drogue dans les 72 dernières heures ?",
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Il faut attendre 72 heures (3 jours) sans alcool ni drogue avant de donner.',
            ],
        ];

        foreach ($questions as $question) {
            QuestionEligibilite::updateOrCreate(
                ['ordre' => $question['ordre']],
                [
                    'question' => $question['question'],
                    'type_reponse' => 'oui_non',
                    'reponse_bloquante' => $question['reponse_bloquante'],
                    'message_refus' => $question['message_refus'],
                    'actif' => true,
                ]
            );
        }
    }
}
