// 📖 'definitive' = contre-indication permanente (aucune date de retour possible)
//    'temporaire' = contre-indication qui disparaît après un délai (delai_jours)
export type TypeIneligibilite = 'definitive' | 'temporaire';

export type ResultatEligibilite =
  | { eligible: true }
  | {
      eligible: false;
      type: TypeIneligibilite;
      motif: string;
      // Présent seulement si type === 'temporaire' : sert à calculer la date de retour possible
      delai_jours?: number;
    };

export type Question = {
  id: number;
  ordre: number;
  texte: string;
  sous_texte?: string;
  // 📖 Chaque réponse mène soit à la question suivante ({ suivant }), soit directement à un résultat final
  reponse_oui: ResultatEligibilite | { suivant: number };
  reponse_non: ResultatEligibilite | { suivant: number };
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    ordre: 1,
    texte: 'Avez-vous entre 18 et 70 ans ?',
    reponse_oui: { suivant: 2 },
    reponse_non: {
      eligible: false,
      type: 'definitive',
      motif: 'Le don de sang est réservé aux personnes âgées de 18 à 70 ans.',
    },
  },
  {
    id: 2,
    ordre: 2,
    texte: 'Pesez-vous plus de 50 kg ?',
    reponse_oui: { suivant: 3 },
    reponse_non: {
      eligible: false,
      type: 'definitive',
      motif: 'Vous devez peser plus de 50 kg pour pouvoir donner votre sang.',
    },
  },
  {
    id: 3,
    ordre: 3,
    texte: "Êtes-vous en bonne santé aujourd'hui ?",
    reponse_oui: { suivant: 4 },
    reponse_non: {
      eligible: false,
      type: 'temporaire',
      motif: 'Vous devez être en bonne santé le jour du don.',
      delai_jours: 0,
    },
  },
  {
    id: 4,
    ordre: 4,
    texte: 'Êtes-vous enceinte ou avez-vous accouché dans les 6 derniers mois ?',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif:
        "Le don est contre-indiqué pendant la grossesse et dans les 6 mois suivant l'accouchement.",
      delai_jours: 180,
    },
    reponse_non: { suivant: 5 },
  },
  {
    id: 5,
    ordre: 5,
    texte: 'Avez-vous eu de la fièvre, une grippe, une gastro ou une infection dans les 15 derniers jours ?',
    sous_texte: 'bronchite, infection urinaire, symptômes infectieux...',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif: 'Attendez la disparition complète des symptômes avant de donner.',
      delai_jours: 15,
    },
    reponse_non: { suivant: 6 },
  },
  {
    id: 6,
    ordre: 6,
    texte: 'Avez-vous une plaie, blessure ou infection de la peau non cicatrisée ?',
    sous_texte: 'furoncle, abcès...',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif: 'Attendez la cicatrisation complète avant de donner.',
      delai_jours: 0,
    },
    reponse_non: { suivant: 7 },
  },
  {
    id: 7,
    ordre: 7,
    texte: 'Avez-vous reçu une transfusion sanguine ou subi une greffe ?',
    sous_texte: "quelle qu'en soit la date",
    reponse_oui: {
      eligible: false,
      type: 'definitive',
      motif: 'Les personnes ayant reçu une transfusion ou une greffe ne peuvent pas donner leur sang.',
    },
    reponse_non: { suivant: 8 },
  },
  {
    id: 8,
    ordre: 8,
    texte: 'Avez-vous des antécédents cardiaques ou neurologiques ?',
    sous_texte: 'infarctus, trouble du rythme, valvulopathie, AVC...',
    reponse_oui: {
      eligible: false,
      type: 'definitive',
      motif: 'Ces antécédents contre-indiquent le don de sang. Consultez le personnel médical du CHT.',
    },
    reponse_non: { suivant: 9 },
  },
  {
    id: 9,
    ordre: 9,
    texte: 'Avez-vous eu un cancer au cours de votre vie ?',
    reponse_oui: {
      eligible: false,
      type: 'definitive',
      motif: 'Un antécédent de cancer contre-indique le don de sang.',
    },
    reponse_non: { suivant: 10 },
  },
  {
    id: 10,
    ordre: 10,
    texte: 'Avez-vous eu une fibroscopie ou une coloscopie dans les 2 derniers mois ?',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif: 'Attendez 2 mois après cet examen avant de donner.',
      delai_jours: 60,
    },
    reponse_non: { suivant: 11 },
  },
  {
    id: 11,
    ordre: 11,
    texte: 'Avez-vous subi une intervention chirurgicale dans les 4 derniers mois ?',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif: 'Attendez 4 mois après une intervention chirurgicale avant de donner.',
      delai_jours: 120,
    },
    reponse_non: { suivant: 12 },
  },
  {
    id: 12,
    ordre: 12,
    texte: 'Avez-vous fait un piercing ou un tatouage dans les 2 derniers mois ?',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif: 'Attendez 2 mois après un piercing ou tatouage avant de donner.',
      delai_jours: 60,
    },
    reponse_non: { suivant: 13 },
  },
  {
    id: 13,
    ordre: 13,
    texte: "Avez-vous eu plus d'un partenaire sexuel dans les 4 derniers mois ?",
    sous_texte: 'même si rapports protégés',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif:
        'Pour des raisons de sécurité transfusionnelle, ce critère contre-indique le don pendant 4 mois.',
      delai_jours: 120,
    },
    reponse_non: { suivant: 14 },
  },
  {
    id: 14,
    ordre: 14,
    texte: 'Avez-vous voyagé dans une zone impaludée dans les 4 derniers mois ?',
    sous_texte: 'Vanuatu, Afrique, Asie du Sud-Est, Amérique centrale ou du Sud',
    reponse_oui: {
      eligible: false,
      type: 'temporaire',
      motif: 'Attendez 4 mois après un retour de zone impaludée avant de donner.',
      delai_jours: 120,
    },
    reponse_non: { suivant: 15 },
  },
  {
    id: 15,
    ordre: 15,
    texte: 'Avez-vous consommé de la drogue ?',
    sous_texte: 'par voie intraveineuse ou autre',
    reponse_oui: {
      eligible: false,
      type: 'definitive',
      motif: 'La consommation de drogues contre-indique définitivement le don de sang.',
    },
    reponse_non: { eligible: true },
  },
];

// 📖 Le "!" dit à TypeScript "je te garantis que find() ne renverra jamais undefined ici"
// → Pourquoi c'est acceptable : les ids référencés par { suivant } sont tous des ids réels de QUESTIONS, contrôlés par nous-mêmes dans ce fichier ; ce n'est pas une donnée utilisateur imprévisible
export const getQuestion = (id: number): Question => QUESTIONS.find((q) => q.id === id)!;
