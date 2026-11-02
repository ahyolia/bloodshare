import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * État de chargement (Figma : Retours & états › LoadingState) : un message
 * et une carte « squelette » qui annonce la forme du contenu à venir.
 *
 * 📖 Le squelette « respire » (opacité), SAUF si la personne a activé
 *    « Réduire les animations » (WCAG 2.3.3) : il reste alors immobile.
 * 📖 Les barres sont décoratives : un lecteur d'écran n'entend que le message.
 */
type Props = { message?: string };

// 📖 Largeur et hauteur de chaque barre : la 1re vient du Figma (185 × 22 sur une
//    carte de 342 px) ; les deux autres font 14 px, déduit de la hauteur totale.
const BARRES: { largeur: DimensionValue; hauteur: number }[] = [
  { largeur: '55%', hauteur: 22 },
  { largeur: '100%', hauteur: 14 },
  { largeur: '75%', hauteur: 14 },
];

export function Chargement({ message = 'Un instant, on prépare tout ça…' }: Props) {
  // 📖 useState (et non useRef(...).current) : lire un ref pendant le rendu
  //    déclenche la règle react-hooks/refs du lint.
  const [opacite] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    let actif = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduire) => {
        if (!actif || reduire) return;
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(opacite, { toValue: 0.5, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(opacite, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
          ]),
        );
        animation.start();
      });

    return () => {
      actif = false;
      animation?.stop();
    };
  }, [opacite]);

  return (
    <View style={styles.conteneur} accessible accessibilityLabel={message} accessibilityLiveRegion="polite">
      <Text style={[Typo.legende, { color: Theme.texte.secondaire }]}>{message}</Text>

      <Animated.View style={[styles.carte, { opacity: opacite }]}>
        {BARRES.map((barre, i) => (
          <View key={i} style={[styles.barre, { width: barre.largeur, height: barre.hauteur }]} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Espace[3], alignSelf: 'stretch' },
  carte: {
    padding: Espace[4],
    gap: Espace[3],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  barre: { borderRadius: Rayon.sm, backgroundColor: Theme.fond.bordure },
});