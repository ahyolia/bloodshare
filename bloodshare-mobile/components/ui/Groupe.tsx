import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';

/**
 * Carte qui regroupe des lignes (ElementListe, réglages, historique), séparées
 * par un filet.
 *
 * 📖 Surélevé = interactif (voir `Ombre.flottante`) :
 *    - `interactif` (par défaut) : des lignes qui se touchent → carte flottante, ombrée ;
 *    - `info` : des lignes qui informent seulement → carte à plat, contour fin.
 * 📖 Deux vues pour la variante ombrée : l'extérieure porte l'ombre, l'intérieure
 *    arrondit les lignes (overflow: hidden). Réunies, l'overflow rognerait l'ombre sur iOS.
 */
type Props = {
  children: ReactNode;
  variante?: 'interactif' | 'info';
  style?: StyleProp<ViewStyle>;
};

export function Groupe({ children, variante = 'interactif', style }: Props) {
  return (
    <View style={[styles.groupe, variante === 'interactif' ? styles.interactif : styles.info, style]}>
      <View style={styles.contenu}>{children}</View>
    </View>
  );
}

/** Largeur de la pastille d'ElementListe : le filet démarre sous le texte, pas sous l'icône. */
const RETRAIT_FILET = Espace[4] + 40 + Espace[3];

export function Separateur() {
  return <View style={styles.separateur} />;
}

const styles = StyleSheet.create({
  groupe: {
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
  },
  interactif: {
    ...Ombre.flottante,
  },
  info: {
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  contenu: {
    borderRadius: Rayon.lg,
    overflow: 'hidden',
  },
  separateur: {
    height: 1,
    marginLeft: RETRAIT_FILET,
    backgroundColor: Theme.fond.bordure,
  },
});
