/**
 * Espacements, rayons et ombres du design system Aïma.
 */
import type { ViewStyle } from 'react-native';

export const Espace = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
} as const;

/**
 * Taille minimale d'une zone tactile (48 × 48), recommandée par Android et au-delà du
 * minimum WCAG. Une seule valeur pour tous les composants qui en ont besoin.
 */
export const CIBLE_MIN = Espace[12];

export const Rayon = {
  sm: 6,
  md: 12,
  lg: 16,
  /** Pilules et cercles. */
  plein: 999,
} as const;

/**
 * 📖 `boxShadow` (React Native 0.76+, donc SDK 57) fonctionne sur iOS, Android et
 *    web avec une seule écriture, recopiée du Figma : décalage x, décalage y, flou,
 *    couleur. Teinte aubergine (#3E2430) et non noire : une ombre noire sur fond
 *    crème paraît sale.
 */
export const Ombre = {
  /**
   * Éléments interactifs (ce qui se touche) et barre d'onglets : aubergine à 16 %.
   * 📖 Règle de l'app : surélevé = interactif. Un bloc qui informe seulement reste
   *    à plat (fond surface + contour `fond.bordure`, comme le Bloc du design system),
   *    pour qu'on distingue d'un coup d'œil ce qui mène quelque part.
   */
  flottante: { boxShadow: '0px 6px 16px rgba(62, 36, 48, 0.16)' },
  /** Modales : aubergine à 22 %. */
  modale: { boxShadow: '0px 12px 32px rgba(62, 36, 48, 0.22)' },
} as const satisfies Record<string, ViewStyle>;
/**
 * Largeur maximale de l'app sur grand écran (tablette, PWA sur ordinateur) : celle d'un
 * grand téléphone. Au-delà, l'app reste une colonne centrée (voir app/_layout).
 */
export const LARGEUR_MAX_APP = 520;
