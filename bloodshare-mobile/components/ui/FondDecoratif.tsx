import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Flottement } from './Flottement';

/**
 * Fond d'écran avec aplats décoratifs (maquettes Auth et onboarding) : grande
 * forme rose, ronds pleins, petite pilule. Pas de dégradé (charte).
 *
 * 📖 Chaque écran décrit SES formes (positions différentes partout) : le composant
 *    ne fige aucune disposition.
 * 📖 Décoratif : invisible pour les lecteurs d'écran, aucun appui capté.
 * 📖 Ellipse = cercle étiré (scaleX) : un borderRadius sur un rectangle donnerait
 *    une pilule à bords droits, pas l'ovale des maquettes.
 * 📖 `anime` : les petites formes (ronds, pilules) flottent doucement ; la grande
 *    ellipse reste fixe, elle sert de repère derrière le contenu.
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
  anime?: boolean;
  style?: StyleProp<ViewStyle>;
};

const EPAISSEUR_PILULE = 10;

export function FondDecoratif({ formes, children, anime = false, style }: Props) {
  return (
    <View style={[styles.ecran, style]}>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {formes.map((forme, i) => {
          const visuel = (
            <View
              style={{
                width: forme.taille,
                height: forme.type === 'pilule' ? EPAISSEUR_PILULE : forme.taille,
                borderRadius: forme.taille / 2,
                backgroundColor: Theme.decor[forme.couleur],
                transform: [
                  { scaleX: forme.type === 'ellipse' ? (forme.etirement ?? 1.3) : 1 },
                  { rotate: `${forme.rotation ?? 0}deg` },
                ],
              }}
            />
          );
          // 📖 La clé décrit la forme : quand l'écran change (onboarding), les
          //    nouvelles formes repartent de zéro et flottent à nouveau.
          const cle = JSON.stringify(forme);

          return anime && forme.type !== 'ellipse' ? (
            <Flottement key={cle} rang={i} style={[styles.forme, forme.position]}>
              {visuel}
            </Flottement>
          ) : (
            <View key={cle} style={[styles.forme, forme.position]}>
              {visuel}
            </View>
          );
        })}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Theme.fond.page, overflow: 'hidden' },
  forme: { position: 'absolute' },
});
