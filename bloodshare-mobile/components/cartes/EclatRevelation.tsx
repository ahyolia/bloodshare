import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Palette } from '../../constants/palette';
import { useLargeurApp } from '../../hooks/useLargeurApp';

const NB_RAYONS = 18;
const COULEURS_RAYONS = [Palette.corail[500], Palette.lime[500], Palette.orange[500]];

// Étincelles autour de la carte : position relative au centre (en fraction de l'écran).
const ETINCELLES = [
  { x: -0.36, y: -0.3, taille: 18, delai: 0 },
  { x: 0.34, y: -0.26, taille: 14, delai: 300 },
  { x: -0.4, y: 0.12, taille: 12, delai: 650 },
  { x: 0.38, y: 0.18, taille: 20, delai: 150 },
  { x: -0.22, y: 0.36, taille: 14, delai: 900 },
  { x: 0.24, y: -0.4, taille: 12, delai: 500 },
  { x: 0.18, y: 0.4, taille: 16, delai: 1100 },
];

/** Démarre une animation, sauf si « Réduire les animations » est activé. */
function useSiMouvement(lancer: () => void, valeurs: SharedValue<number>[]) {
  useEffect(() => {
    let actif = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduire) => {
        if (actif && !reduire) lancer();
      })
      .catch(() => undefined);
    return () => {
      actif = false;
      valeurs.forEach((valeur) => cancelAnimation(valeur));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lancé une seule fois, au montage
  }, []);
}

// 📖 Fond de l'obtention d'une carte, inspiré des tirages de cartes des jeux : derrière la
//    carte, des rayons de lumière aux couleurs de la marque tournent lentement, un halo
//    pulse, une onde s'élargit au moment où la carte se pose, et des étincelles scintillent.
//    Purement décoratif : invisible pour le lecteur d'écran, et immobile (rayons fixes, ni
//    onde ni étincelles) si « Réduire les animations » est activé.
export function EclatRevelation({ delai = 0 }: { /** Moment où la carte se pose (ms). */ delai?: number }) {
  const { width, height } = useLargeurApp();
  const diagonale = Math.hypot(width, height);

  const apparition = useSharedValue(0);
  const rotation = useSharedValue(0);
  const halo = useSharedValue(0);
  const onde1 = useSharedValue(0);
  const onde2 = useSharedValue(0);

  useSiMouvement(() => {
    apparition.value = withDelay(delai, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.6)) }));
    rotation.value = withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1, false);
    halo.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
    onde1.value = withDelay(delai, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    onde2.value = withDelay(delai + 250, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [apparition, rotation, halo, onde1, onde2]);

  const styleRayons = useAnimatedStyle(() => ({
    // Sans animation (Réduire les animations) : rayons visibles mais fixes.
    opacity: apparition.value === 0 && rotation.value === 0 ? 0.6 : apparition.value,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: 0.4 + apparition.value * 0.6 }],
  }));
  const styleHalo = useAnimatedStyle(() => ({
    opacity: 0.35 + halo.value * 0.25,
    transform: [{ scale: 0.9 + halo.value * 0.15 }],
  }));
  const styleOnde = (onde: SharedValue<number>) => ({
    opacity: onde.value === 0 || onde.value === 1 ? 0 : 1 - onde.value,
    transform: [{ scale: 0.3 + onde.value * 2.2 }],
  });
  const styleOnde1 = useAnimatedStyle(() => styleOnde(onde1));
  const styleOnde2 = useAnimatedStyle(() => styleOnde(onde2));

  return (
    <View style={styles.fond} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.halo, styleHalo]} />

      <Animated.View style={[{ width: diagonale, height: diagonale }, styles.centre, styleRayons]}>
        {Array.from({ length: NB_RAYONS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.rayon,
              {
                height: diagonale / 2,
                backgroundColor: COULEURS_RAYONS[i % COULEURS_RAYONS.length],
                transform: [{ rotate: `${(i * 360) / NB_RAYONS}deg` }, { translateY: -diagonale / 4 }],
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[styles.onde, styleOnde1]} />
      <Animated.View style={[styles.onde, styles.ondeFine, styleOnde2]} />

      {ETINCELLES.map((etincelle, i) => (
        <Etincelle key={i} {...etincelle} x={etincelle.x * width} y={etincelle.y * height} depart={delai} />
      ))}
    </View>
  );
}

function Etincelle({ x, y, taille, delai, depart }: { x: number; y: number; taille: number; delai: number; depart: number }) {
  const eclat = useSharedValue(0);

  useSiMouvement(() => {
    eclat.value = withDelay(
      depart + delai,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 650, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );
  }, [eclat]);

  const style = useAnimatedStyle(() => ({
    opacity: eclat.value,
    transform: [{ translateX: x }, { translateY: y }, { scale: 0.4 + eclat.value * 0.8 }, { rotate: `${eclat.value * 90}deg` }],
  }));

  return (
    <Animated.View style={[styles.etincelle, style]}>
      <Ionicons name="sparkles" size={taille} color={Palette.lime[500]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fond: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centre: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Rayon fin, du centre vers le bord : très transparent, ils se fondent dans le fond sombre.
  rayon: {
    position: 'absolute',
    width: 26,
    opacity: 0.16,
    borderRadius: 13,
  },
  halo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Palette.corail[500],
    filter: 'blur(40px)',
  },
  onde: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: Palette.neutre[0],
  },
  ondeFine: {
    borderWidth: 1.5,
    borderColor: Palette.lime[500],
  },
  etincelle: {
    position: 'absolute',
  },
});
