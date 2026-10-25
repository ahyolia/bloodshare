import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Palette } from '../../constants/palette';
import { Rayon } from '../../constants/spacing';

type Cercle = {
  style: ViewStyle;
  couleur: string;
  opacite: number;
  /** Déplacement maximal en x et en y (px), et durée d'un aller (ms). */
  dx: number;
  dy: number;
  duree: number;
};

const CERCLES: Cercle[] = [
  { style: { width: 160, height: 160, right: -40, bottom: -60 }, couleur: Palette.corail[500], opacite: 0.35, dx: -14, dy: -10, duree: 4200 },
  { style: { width: 70, height: 70, right: 80, top: -28 }, couleur: Palette.lime[500], opacite: 0.3, dx: 18, dy: 12, duree: 3400 },
  { style: { width: 34, height: 34, left: '55%', bottom: 18 }, couleur: Palette.petrole[500], opacite: 0.45, dx: 10, dy: -14, duree: 2800 },
];

function CercleFlottant({ cercle }: { cercle: Cercle }) {
  const avancement = useSharedValue(0);

  useEffect(() => {
    let actif = true;
    // 📖 Même vérification que Chargement : rien ne bouge si « Réduire les animations » est activé.
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduire) => {
        if (!actif || reduire) return;
        // Aller-retour sans fin, en douceur : le cercle « flotte ».
        avancement.value = withRepeat(
          withTiming(1, { duration: cercle.duree, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        );
      })
      .catch(() => undefined);

    return () => {
      actif = false;
      cancelAnimation(avancement);
    };
  }, [avancement, cercle.duree]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: avancement.value * cercle.dx }, { translateY: avancement.value * cercle.dy }],
  }));

  return (
    <Animated.View
      style={[styles.cercle, cercle.style, { backgroundColor: cercle.couleur, opacity: cercle.opacite }, style]}
    />
  );
}

// 📖 Cercles de couleur du bandeau Quiz, qui flottent doucement. Décoratifs : ignorés des
//    lecteurs d'écran, et immobiles si « Réduire les animations » est activé.
export function DecorBandeau() {
  return (
    <>
      {CERCLES.map((cercle, index) => (
        <CercleFlottant key={index} cercle={cercle} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  cercle: {
    position: 'absolute',
    borderRadius: Rayon.plein,
  },
});
