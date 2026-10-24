// 📖 Les 15 critères du Don du Sang (liste officielle transmise par le centre), posés dans
//    l'ordre. Une réponse « bloquante » arrête le questionnaire : c'est un délai ou une
//    situation à voir avec le centre. L'app ne rend jamais de verdict définitif ni de date :
//    seuls les médecins du Don du Sang décident, le jour du don.
//    Même contenu que QuestionEligibiliteSeeder côté backend : modifier les deux ensemble.

export type Reponse = 'oui' | 'non' | 'ne_sait_pas';

export type Question = {
  id: number;
  texte: string;
  sous_texte?: string;
  // Réponse qui empêche de donner pour le moment.
  reponse_bloquante: 'oui' | 'non';
  // Ce qui est expliqué à l'utilisateur quand il donne la réponse bloquante.
  motif: string;
};

export type ResultatEligibilite =
  | { statut: 'eligible' }
  | { statut: 'delai'; motif: string }
  // « Je ne sais pas » : on renvoie vers le centre plutôt que de deviner.
  | { statut: 'a_verifier'; question: string };

// Messages du Don du Sang, au tutoiement de l'app.
export const MESSAGE_ELIGIBLE =
  "D'après tes réponses, rien ne semble t'empêcher de donner ton sang. Seuls les médecins du Don du Sang peuvent confirmer ton éligibilité le jour du don.";
export const MESSAGE_DELAI =
  "D'après tes réponses, un délai est habituellement nécessaire avant de donner. Contacte le Don du Sang afin de vérifier ta situation précise.";
export const MESSAGE_A_VERIFIER =
  'Contacte le Don du Sang afin de vérifier ta situation précise.';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    texte: 'As-tu entre 18 et 70 ans ?',
    reponse_bloquante: 'non',
    motif: 'Le don du sang est possible de 18 à 70 ans.',
  },
  {
    id: 2,
    texte: 'Pèses-tu plus de 50 kg ?',
    reponse_bloquante: 'non',
    motif: 'Il faut peser plus de 50 kg pour donner son sang.',
  },
  {
    id: 3,
    texte: "Es-tu en bonne santé aujourd'hui ?",
    reponse_bloquante: 'non',
    motif: 'Il faut être en bonne santé le jour du don.',
  },
  {
    id: 4,
    texte: 'Es-tu enceinte, ou as-tu accouché dans les 6 derniers mois ?',
    reponse_bloquante: 'oui',
    motif:
      "Le don n'est pas possible pendant la grossesse, ni dans les 6 mois qui suivent l'accouchement.",
  },
  {
    id: 5,
    texte: 'As-tu eu de la fièvre ou une infection dans les 15 derniers jours ?',
    sous_texte: 'grippe, gastro-entérite, bronchite, infection urinaire…',
    reponse_bloquante: 'oui',
    motif: 'Il faut attendre 15 jours après la disparition complète des symptômes.',
  },
  {
    id: 6,
    texte: "As-tu une plaie, une blessure ou une infection de la peau qui n'est pas encore cicatrisée ?",
    sous_texte: 'furoncle, égratignure qui suinte…',
    reponse_bloquante: 'oui',
    motif: 'Il faut attendre que la peau soit complètement cicatrisée.',
  },
  {
    id: 7,
    texte: 'As-tu déjà reçu une transfusion sanguine ou une greffe ?',
    sous_texte: "quelle qu'en soit la date",
    reponse_bloquante: 'oui',
    motif: 'Une transfusion ou une greffe, même ancienne, est à signaler au Don du Sang.',
  },
  {
    id: 8,
    texte: 'As-tu des antécédents cardiaques ou neurologiques ?',
    sous_texte: 'infarctus, trouble du rythme, valvulopathie, AVC…',
    reponse_bloquante: 'oui',
    motif: 'Les antécédents cardiaques ou neurologiques sont à voir avec un médecin du Don du Sang.',
  },
  {
    id: 9,
    texte: 'As-tu déjà eu un cancer ?',
    reponse_bloquante: 'oui',
    motif: 'Un antécédent de cancer est à voir avec un médecin du Don du Sang.',
  },
  {
    id: 10,
    texte: 'As-tu eu une fibroscopie ou une coloscopie dans les 2 derniers mois ?',
    reponse_bloquante: 'oui',
    motif: 'Il faut attendre 2 mois après une fibroscopie ou une coloscopie.',
  },
  {
    id: 11,
    texte: 'As-tu subi une opération chirurgicale dans les 4 derniers mois ?',
    reponse_bloquante: 'oui',
    motif: 'Il faut attendre 4 mois après une opération.',
  },
  {
    id: 12,
    texte: 'As-tu fait un tatouage ou un piercing dans les 2 derniers mois ?',
    sous_texte: "y compris maquillage permanent et trous d'oreilles",
    reponse_bloquante: 'oui',
    motif: 'Il faut attendre 2 mois après un tatouage ou un piercing.',
  },
  {
    id: 13,
    texte: "As-tu eu plus d'un partenaire sexuel dans les 4 derniers mois ?",
    sous_texte: 'même avec des rapports protégés',
    reponse_bloquante: 'oui',
    motif: "Il faut attendre 4 mois après avoir eu plus d'un partenaire sexuel.",
  },
  {
    id: 14,
    texte: 'As-tu voyagé dans une zone impaludée dans les 4 derniers mois ?',
    sous_texte: 'zone où le paludisme est présent : Vanuatu, Afrique, Asie du Sud-Est, Amérique centrale ou du Sud',
    reponse_bloquante: 'oui',
    motif: "Il faut attendre 4 mois après le retour d'une zone impaludée.",
  },
  {
    id: 15,
    texte: "As-tu bu de l'alcool ou consommé de la drogue dans les 72 dernières heures ?",
    reponse_bloquante: 'oui',
    motif: "Il faut attendre 72 heures (3 jours) sans alcool ni drogue avant de donner.",
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;

/**
 * Résultat déclenché par une réponse, ou `null` si le questionnaire continue.
 * 📖 Fonction pure : le hook s'en sert, et elle se teste sans monter de composant.
 */
export const resultatPour = (question: Question, reponse: Reponse): ResultatEligibilite | null => {
  if (reponse === 'ne_sait_pas') return { statut: 'a_verifier', question: question.texte };
  if (reponse === question.reponse_bloquante) return { statut: 'delai', motif: question.motif };
  return null;
};
