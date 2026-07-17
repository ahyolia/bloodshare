<?php

namespace Database\Seeders;

use App\Models\QuestionEligibilite;
use Illuminate\Database\Seeder;

class QuestionEligibiliteSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            [
                'ordre' => 1,
                'question' => 'Avez-vous entre 18 et 70 ans ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'non',
                'message_refus' => 'Le don de sang est réservé aux personnes âgées de 18 à 70 ans.',
                'actif' => true,
            ],
            [
                'ordre' => 2,
                'question' => 'Pesez-vous plus de 50 kg ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'non',
                'message_refus' => 'Vous devez peser plus de 50 kg pour pouvoir donner votre sang.',
                'actif' => true,
            ],
            [
                'ordre' => 3,
                'question' => 'Êtes-vous en bonne santé ce jour ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'non',
                'message_refus' => 'Vous devez être en bonne santé le jour du don.',
                'actif' => true,
            ],
            [
                'ordre' => 4,
                'question' => 'Êtes-vous enceinte ou avez-vous accouché dans les 6 derniers mois ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Le don est contre-indiqué pendant la grossesse et dans les 6 mois suivant l\'accouchement.',
                'actif' => true,
            ],
            [
                'ordre' => 5,
                'question' => 'Avez-vous présenté des symptômes infectieux (fièvre, grippe, gastro, bronchite, infection urinaire...) dans les 15 derniers jours ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attendez 15 jours après la disparition complète des symptômes avant de donner.',
                'actif' => true,
            ],
            [
                'ordre' => 6,
                'question' => 'Avez-vous une plaie, blessure ou infection de la peau non cicatrisée (furoncle, abcès...) ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attendez la cicatrisation complète avant de donner.',
                'actif' => true,
            ],
            [
                'ordre' => 7,
                'question' => 'Avez-vous subi une transfusion sanguine ou une greffe, quelle qu\'en soit la date ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Les personnes ayant reçu une transfusion ou une greffe ne peuvent pas donner leur sang.',
                'actif' => true,
            ],
            [
                'ordre' => 8,
                'question' => 'Avez-vous des antécédents cardiaques ou neurologiques (infarctus, trouble du rythme, valvulopathie, AVC) ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Ces antécédents contre-indiquent le don de sang. Consultez le personnel médical du CHT.',
                'actif' => true,
            ],
            [
                'ordre' => 9,
                'question' => 'Avez-vous eu une pathologie cancéreuse au cours de votre vie ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Un antécédent de cancer contre-indique le don de sang.',
                'actif' => true,
            ],
            [
                'ordre' => 10,
                'question' => 'Avez-vous subi une fibroscopie ou une coloscopie dans les 2 derniers mois ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attendez 2 mois après une fibroscopie ou coloscopie avant de donner.',
                'actif' => true,
            ],
            [
                'ordre' => 11,
                'question' => 'Avez-vous subi une intervention chirurgicale dans les 4 derniers mois ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attendez 4 mois après une intervention chirurgicale avant de donner.',
                'actif' => true,
            ],
            [
                'ordre' => 12,
                'question' => 'Avez-vous réalisé un piercing ou un tatouage dans les 2 derniers mois ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attendez 2 mois après un piercing ou tatouage avant de donner.',
                'actif' => true,
            ],
            [
                'ordre' => 13,
                'question' => 'Avez-vous eu plus d\'un partenaire sexuel dans les 4 derniers mois ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Pour des raisons de sécurité transfusionnelle, ce critère contre-indique le don pendant 4 mois.',
                'actif' => true,
            ],
            [
                'ordre' => 14,
                'question' => 'Avez-vous voyagé dans une zone impaludée dans les 4 derniers mois ? (Vanuatu, Afrique, Asie du Sud-Est, Amérique centrale ou du Sud)',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'Attendez 4 mois après un retour de zone impaludée avant de donner.',
                'actif' => true,
            ],
            [
                'ordre' => 15,
                'question' => 'Avez-vous consommé de la drogue (par voie intraveineuse ou autre) ?',
                'type_reponse' => 'oui_non',
                'reponse_bloquante' => 'oui',
                'message_refus' => 'La consommation de drogues contre-indique définitivement le don de sang.',
                'actif' => true,
            ],
        ];

        foreach ($questions as $q) {
            QuestionEligibilite::updateOrCreate(
                ['ordre' => $q['ordre']],
                $q
            );
        }
    }
}
