<?php

namespace Database\Seeders;

use App\Models\QuestionEligibilite;
use Illuminate\Database\Seeder;

// 📖 Reprend exactement les 15 critères du référentiel CHT NC déjà codés en dur
// côté mobile (bloodshare-mobile/constants/eligibilite.ts), pour que le
// backoffice reste la source de vérité future sans dupliquer un contenu
// différent de ce que l'app affiche aujourd'hui.
class QuestionEligibiliteSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            [
                'ordre' => 1,
                'question' => 'As-tu entre 18 et 70 ans ?',
                'reponse_bloquante' => 'non',
                'message_refus' => 'Le don de sang est réservé aux personnes âgées de 18 à 70 ans.',
            ],
            [
                'ordre' => 2,
                'question' => 'Pèses-tu plus de 50 kg ?',
                'reponse_bloquante' => 'non',
                'message_refus' => 'Tu dois peser plus de 50 kg pour pouvoir donner ton sang.',
            ],
            [
                'ordre' => 3,
                'question' => "Es-tu en bonne santé aujourd'hui ?",
                'reponse_bloquante' => 'non',
                'message_refus' => 'Tu dois être en bonne santé le jour du don.',
            ],
            [
                'ordre' => 4,
                'question' => 'Es-tu enceinte ou as-tu accouché dans les 6 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => "Le don est contre-indiqué pendant la grossesse et dans les 6 mois suivant l'accouchement.",
            ],
            [
                'ordre' => 5,
                'question' => 'As-tu eu de la fièvre, une grippe, une gastro ou une infection dans les 15 derniers jours ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attends la disparition complète des symptômes avant de donner.',
            ],
            [
                'ordre' => 6,
                'question' => 'As-tu une plaie, blessure ou infection de la peau non cicatrisée ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attends la cicatrisation complète avant de donner.',
            ],
            [
                'ordre' => 7,
                'question' => 'As-tu reçu une transfusion sanguine ou subi une greffe ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Les personnes ayant reçu une transfusion ou une greffe ne peuvent pas donner leur sang.',
            ],
            [
                'ordre' => 8,
                'question' => 'As-tu des antécédents cardiaques ou neurologiques ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Ces antécédents contre-indiquent le don de sang. Consulte le personnel médical du CHT.',
            ],
            [
                'ordre' => 9,
                'question' => 'As-tu eu un cancer au cours de ta vie ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Un antécédent de cancer contre-indique le don de sang.',
            ],
            [
                'ordre' => 10,
                'question' => 'As-tu eu une fibroscopie ou une coloscopie dans les 2 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attends 2 mois après cet examen avant de donner.',
            ],
            [
                'ordre' => 11,
                'question' => 'As-tu subi une intervention chirurgicale dans les 4 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attends 4 mois après une intervention chirurgicale avant de donner.',
            ],
            [
                'ordre' => 12,
                'question' => 'As-tu fait un piercing ou un tatouage dans les 2 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attends 2 mois après un piercing ou tatouage avant de donner.',
            ],
            [
                'ordre' => 13,
                'question' => "As-tu eu plus d'un partenaire sexuel dans les 4 derniers mois ?",
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Pour des raisons de sécurité transfusionnelle, ce critère contre-indique le don pendant 4 mois.',
            ],
            [
                'ordre' => 14,
                'question' => 'As-tu voyagé dans une zone impaludée dans les 4 derniers mois ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attends 4 mois après un retour de zone impaludée avant de donner.',
            ],
            [
                'ordre' => 15,
                'question' => 'As-tu consommé de la drogue ?',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'La consommation de drogues contre-indique définitivement le don de sang.',
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
