import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';

/**
 * Fond d'écran avec aplats décoratifs (maquettes Auth et onboarding) : grande
 * forme rose, ronds pleins, petite pilule. Pas de dégradé (charte).
 *
 * 📖 Chaque écran décrit SES formes (positions différentes partout) : le composant
 *    ne fige aucune disposition.
 * 📖 Décoratif : invisible pour les lecteurs d'écran, aucun appui capté.
 * 📖 Ellipse = cercle étiré (scaleX) : un borderRadius sur un rectangle donnerait
 *    une pilule à bords droits, pas l'ovale des maquettes.
 */
export type Forme = {
  type: 'rond' | 'ellipse' | 'pilule';
  couleur: keyof typeof Theme.decor;
  /** Diamètre (rond, ellipse) ou longueur (pilule). */
  taille: number;
  /** Ellipse : étirement horizontal (1,3 = 30 % plus large que haute). */
  etirement?: number;
  rotation?: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
};

type Props = {
  formes: Forme[];
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const EPAISSEUR_PILULE = 10;

export function FondDecoratif({ formes, children, style }: Props) {
  return (
    <View style={[styles.ecran, style]}>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {formes.map((forme, i) => (
          <View
            key={i}
            style={[
              styles.forme,
              forme.position,
              {
                width: forme.taille,
                height: forme.type === 'pilule' ? EPAISSEUR_PILULE : forme.taille,
                borderRadius: forme.taille / 2,
                backgroundColor: Theme.decor[forme.couleur],
                transform: [
                  { scaleX: forme.type === 'ellipse' ? (forme.etirement ?? 1.3) : 1 },
                  { rotate: `${forme.rotation ?? 0}deg` },
                ],
              },
            ]}
          />
        ))}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Theme.fond.page, overflow: 'hidden' },
  forme: { position: 'absolute' },
});