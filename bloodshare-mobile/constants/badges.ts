// 📖 L'API (GET /badges) ne renvoie que id / nom / image_url / obtenu / obtenu_at :
//    ni description, ni condition, ni catégorie. Ce référentiel local comble ce vide
//    côté app, indexé par le nom exact du badge en base. Si un badge du catalogue BO
//    n'a pas d'entrée ici, l'écran doit quand même s'afficher (repli générique) plutôt
//    que planter : voir BADGE_INFO_PAR_DEFAUT dans l'écran.
export type CategorieBadge = 'dons' | 'cartes' | 'quiz' | 'parrainage' | 'defis';

export type BadgeInfo = {
  description: string;
  condition: string;
  emoji: string;
  categorie: CategorieBadge;
};

export const BADGES_INFO: Record<string, BadgeInfo> = {
  'Premier Pas': {
    emoji: '🩸',
    categorie: 'dons',
    description: "Votre premier pas dans l'aventure du don de sang.",
    condition: 'Valider votre 1er don',
  },
  'Donneur Confirmé': {
    emoji: '💪',
    categorie: 'dons',
    description: 'Vous avez prouvé votre engagement envers le don.',
    condition: 'Valider 3 dons',
  },
  'Fidèle au Don': {
    emoji: '❤️',
    categorie: 'dons',
    description: 'Votre fidélité sauve des vies.',
    condition: 'Valider 5 dons',
  },
  'Compagnon de route': {
    emoji: '🏃',
    categorie: 'dons',
    description: "10 dons, c'est une vraie histoire d'amour avec le don.",
    condition: 'Valider 10 dons',
  },
  'Belle collection': {
    emoji: '🗓️',
    categorie: 'cartes',
    description: 'Votre collection de cartes prend forme !',
    condition: 'Obtenir 6 cartes Mois du don',
  },
  'Année complète': {
    emoji: '🌟',
    categorie: 'cartes',
    description: "12 mois, 12 dons, 12 cartes. L'année parfaite du donneur.",
    condition: 'Obtenir les 12 cartes Mois du don',
  },
  'Toujours partant': {
    emoji: '🎪',
    categorie: 'cartes',
    description: 'Les événements de collecte vous connaissent bien !',
    condition: 'Obtenir 3 cartes Événement',
  },
  'Grain de curiosité': {
    emoji: '💡',
    categorie: 'quiz',
    description: "La curiosité est le début de l'engagement.",
    condition: 'Terminer votre 1er quiz',
  },
  'Quiz Master': {
    emoji: '🎓',
    categorie: 'quiz',
    description: 'Vous maîtrisez les bases du don de sang.',
    condition: 'Terminer 5 quiz',
  },
  Incollable: {
    emoji: '🏆',
    categorie: 'quiz',
    description: 'Vous avez tout appris sur le don de sang. Impressionnant !',
    condition: 'Compléter tous les quiz de toutes les catégories',
  },
  Ambassadeur: {
    emoji: '🤝',
    categorie: 'parrainage',
    description: "Grâce à vous, un nouveau donneur a rejoint l'aventure.",
    condition: 'Valider 1 parrainage',
  },
  'Bien entouré': {
    emoji: '👥',
    categorie: 'parrainage',
    description: 'Votre réseau de donneurs s\'agrandit !',
    condition: 'Valider 3 parrainages',
  },
  'Bien accueilli': {
    emoji: '🎉',
    categorie: 'parrainage',
    description: 'Quelqu\'un a cru en vous avant même votre premier don.',
    condition: 'S\'inscrire avec un code de parrainage',
  },
  "Esprit d'équipe": {
    emoji: '🌊',
    categorie: 'defis',
    description: 'Ensemble on va plus loin. Votre don compte pour tous.',
    condition: 'Contribuer à un défi du mois',
  },
  'Objectif atteint': {
    emoji: '🎯',
    categorie: 'defis',
    description: 'Le défi collectif a réussi grâce à vous et à tous les donneurs.',
    condition: 'Participer à un défi collectif remporté',
  },

  // 📖 Ces deux noms existent réellement dans la base (seed actuel) mais pas encore
  //    dans le référentiel produit ci-dessus : gardés pour que l'écran reste correct
  //    tant que le catalogue BO n'a pas été aligné sur les 15 badges définitifs.
  'Collection en cours': {
    emoji: '🗓️',
    categorie: 'cartes',
    description: 'Votre collection de cartes prend forme !',
    condition: 'Obtenir 6 cartes Mois du don',
  },
  'Défi du mois': {
    emoji: '🌊',
    categorie: 'defis',
    description: 'Ensemble on va plus loin. Votre don compte pour tous.',
    condition: 'Contribuer à un défi du mois',
  },
};

export const CATEGORIE_COLOR: Record<CategorieBadge, string> = {
  dons: '#D6543A', // corail
  cartes: '#2E93A0', // pétrole
  quiz: '#C6DA2C', // lime
  parrainage: '#6E9B3E', // vert
  defis: '#F0A03C', // orange
};

export const CATEGORIE_LABEL: Record<CategorieBadge, string> = {
  dons: '🩸 Dons',
  cartes: '🃏 Collection',
  quiz: '📚 Quiz',
  parrainage: '🤝 Parrainage',
  defis: '🏆 Défis',
};

export const CATEGORIES_FILTRE: CategorieBadge[] = ['dons', 'cartes', 'quiz', 'parrainage', 'defis'];
