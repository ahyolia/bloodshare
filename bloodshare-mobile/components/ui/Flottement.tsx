import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Fait flotter son contenu en continu : ronds de couleur, blocs d'illustration.
 *
 * 📖 Deux mouvements indépendants, un horizontal et un vertical, de durées
 *    différentes : combinés, ils dessinent une boucle qui se décale à chaque tour.
 *    Chaque `rang` a ses propres amplitudes et durées : deux éléments voisins ne
 *    bougent jamais pareil.
 * 📖 Immobile si « Réduire les animations » est activé (WCAG 2.3.3).
 */
type Props = {
  children: ReactNode;
  /** Choisit le mouvement (0, 1, 2…) : un rang différent par élément. */
  rang?: number;
  /** Multiplie l'amplitude : 1 pour les ronds, moins pour les gros blocs. */
  intensite?: number;
  style?: StyleProp<ViewStyle>;
};

// 📖 Durées choisies pour ne pas tomber juste les unes avec les autres : sinon
//    les ronds finiraient par se synchroniser.
const MOUVEMENTS = [
  { x: 10, y: -16, dureeX: 1700, dureeY: 1300 },
  { x: -14, y: 12, dureeX: 1500, dureeY: 1900 },
  { x: 12, y: 14, dureeX: 2100, dureeY: 1450 },
  { x: -8, y: -18, dureeX: 1250, dureeY: 1650 },
  { x: 16, y: -10, dureeX: 1850, dureeY: 1150 },
] as const;

export function Flottement({ children, rang = 0, intensite = 1, style }: Props) {
  const mouvement = MOUVEMENTS[rang % MOUVEMENTS.length];
  // 📖 useState (et non useRef(...).current) : lire un ref pendant le rendu
  //    déclenche la règle react-hooks/refs du lint.
  const [x] = useState(() => new Animated.Value(0));
  const [y] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];
    let actif = true;

    const allerRetour = (valeur: Animated.Value, duree: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(valeur, {
            toValue: 1,
            duration: duree,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(valeur, {
            toValue: 0,
            duration: duree,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      );

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduire) => {
        if (!actif || reduire) return;
        animations.push(allerRetour(x, mouvement.dureeX), allerRetour(y, mouvement.dureeY));
        animations.forEach((a) => a.start());
      });

    return () => {
      actif = false;
      animations.forEach((a) => a.stop());
    };
  }, [x, y, mouvement]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, mouvement.x * intensite] });
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [0, mouvement.y * intensite] });

  return <Animated.View style={[style, { transform: [{ translateX }, { translateY }] }]}>{children}</Animated.View>;
}
