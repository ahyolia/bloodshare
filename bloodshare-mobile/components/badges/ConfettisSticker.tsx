import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Palette } from '../../constants/palette';
import { useReduireAnimations } from '../../hooks/useReduireAnimations';

const COULEURS = [
  Palette.lime[500],
  Palette.orange[500],
  Palette.corail[500],
  Palette.petrole[500],
  Palette.mousse[600],
];
const NOMBRE = 48;
// Durée de vie d'un confetti (s) : le temps de monter, puis de retomber hors de l'écran.
const DUREE = 4;
// Gravité (px/s²) et frottement de l'air (1/s) : vitesse limite de chute = G / K ≈ 300 px/s,
// la chute lente et flottante d'un confetti en papier.
const G = 760;
const K = 2.5;

// Pseudo-hasard stable (même tirage à chaque rendu, et dans les tests).
const hasard = (graine: number) => {
  const x = Math.sin(graine * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function Confetti({ index }: { index: number }) {
  const t = useSharedValue(0);

  // Tir en éventail vers le haut, depuis le centre du sticker.
  const angle = ((-165 + hasard(index) * 150) * Math.PI) / 180;
  const vitesse = 420 + hasard(index + 1) * 520;
  const vx = Math.cos(angle) * vitesse;
  const vy = Math.sin(angle) * vitesse;
  const balancement = 8 + hasard(index + 2) * 16;
  const frequence = 4 + hasard(index + 3) * 4;
  const tours = (hasard(index + 4) > 0.5 ? 1 : -1) * (180 + hasard(index + 5) * 360);
  const retournement = 6 + hasard(index + 6) * 8;
  const forme = index % 3; // 0 : rectangle, 1 : carré, 2 : rond
  const couleur = COULEURS[index % COULEURS.length];
  // Deux salves : la grande au moment où le sticker se colle, une plus petite juste après.
  const delai = index < 32 ? 330 : 650;

  useEffect(() => {
    t.value = withDelay(delai, withTiming(DUREE, { duration: DUREE * 1000, easing: Easing.linear }));
    return () => cancelAnimation(t);
  }, [delai, t]);

  const style = useAnimatedStyle(() => {
    const s = t.value;
    const amorti = (1 - Math.exp(-K * s)) / K;
    // Mouvement freiné par l'air (dv/dt = G − K·v) : monte, ralentit, puis retombe.
    const x = vx * amorti + Math.sin(s * frequence) * balancement * Math.min(s, 1);
    const y = (G / K) * s + (vy - G / K) * amorti;
    return {
      opacity: s === 0 ? 0 : Math.min(1, (DUREE - s) * 2),
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${tours * s}deg` },
        // Le papier se retourne en tombant.
        { scaleX: Math.cos(s * retournement) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        forme === 0 && styles.rectangle,
        forme === 2 && styles.rond,
        { backgroundColor: couleur },
        style,
      ]}
    />
  );
}

// 📖 Confettis du popup de badge : projetés vers le haut depuis le sticker quand il se
//    colle, freinés par l'air, puis ils retombent en se balançant et en se retournant
//    jusqu'en bas de l'écran. Rien si « Réduire les animations » est activé.
export function ConfettisSticker() {
  const reduire = useReduireAnimations();
  if (reduire !== false) return null;

  return (
    <View style={styles.centre} pointerEvents="none" importantForAccessibility="no-hide-descendants">
      {Array.from({ length: NOMBRE }, (_, index) => (
        <Confetti key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    borderRadius: 2,
  },
  rectangle: {
    width: 7,
    height: 14,
    marginLeft: -3,
    marginTop: -7,
  },
  rond: {
    borderRadius: 999,
  },
});
