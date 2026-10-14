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
  /** Cartes, barre d'onglets : aubergine à 16 %. */
  flottante: { boxShadow: '0px 6px 16px rgba(62, 36, 48, 0.16)' },
  /** Modales : aubergine à 22 %. */
  modale: { boxShadow: '0px 12px 32px rgba(62, 36, 48, 0.22)' },
} as const satisfies Record<string, ViewStyle>;