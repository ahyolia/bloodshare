/**
 * Typographie du design system Aïma.
 *
 * 📖 Une famille par graisse (NunitoSans-Regular / NunitoSans-Bold) et JAMAIS de
 *    `fontWeight` avec une police personnalisée : sur iOS, la combinaison peut faire
 *    retomber sur la police système, et sur Android le gras est simulé. Les noms
 *    de familles sont ceux déclarés dans le `useFonts` de `app/_layout.tsx`.
 * 📖 Les couleurs ne sont pas ici : un style de texte = police, taille, interligne.
 *    La couleur vient de `Theme` (constants/colors.ts).
 */
import type { TextStyle } from 'react-native';

export const Police = {
  /** Police de corps (Nunito Sans). */
  corps: 'NunitoSans-Regular',
  corpsGras: 'NunitoSans-Bold',
  /** Grands titres uniquement (titre-1). Jamais en texte courant. */
  titre: 'Pacifico-Regular',
} as const;

// 📖 `satisfies` vérifie que chaque style est un TextStyle valide tout en gardant
//    les valeurs exactes (26, 32…) dans le type : l'autocomplétion les affiche.
export const Typo = {
  /** Titre de page. Pacifico : interligne à vérifier sur Android (boucles hautes). */
  titre1: { fontFamily: Police.titre, fontSize: 26, lineHeight: 32 },
  /** Titre de section. */
  titre2: { fontFamily: Police.corpsGras, fontSize: 21, lineHeight: 28 },
  /** Titre de carte, de modale. */
  titre3: { fontFamily: Police.corpsGras, fontSize: 18, lineHeight: 24 },
  corps: { fontFamily: Police.corps, fontSize: 16, lineHeight: 24 },
  corpsFort: { fontFamily: Police.corpsGras, fontSize: 16, lineHeight: 24 },
  /** Textes d'aide, dates, compléments. */
  legende: { fontFamily: Police.corps, fontSize: 14, lineHeight: 20 },
  legendeForte: { fontFamily: Police.corpsGras, fontSize: 14, lineHeight: 20 },
  /** Libellé des boutons. */
  bouton: { fontFamily: Police.corpsGras, fontSize: 16, lineHeight: 20 },
  /** Libellés de la barre d'onglets. */
  onglet: { fontFamily: Police.corpsGras, fontSize: 12, lineHeight: 16 },
} as const satisfies Record<string, TextStyle>;