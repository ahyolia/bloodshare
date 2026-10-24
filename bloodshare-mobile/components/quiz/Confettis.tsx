import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Palette } from '../../constants/palette';
import { useReduireAnimations } from '../../hooks/useReduireAnimations';

const COULEURS = [Palette.lime[500], Palette.orange[500], Palette.petrole[500], Palette.mousse[600]];
const NOMBRE = 18;

function Confetti({ index }: { index: number }) {
  const t = useSharedValue(0);
  // Chaque confetti part dans sa direction, à sa distance, puis retombe un peu.
  const angle = (index / NOMBRE) * Math.PI * 2;
  const distance = 90 + (index % 3) * 28;
  const largeur = index % 2 === 0 ? 8 : 6;

  useEffect(() => {
    t.value = withDelay(250 + (index % 4) * 40, withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }));
  }, [index, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * t.value,
    transform: [
      { translateX: Math.cos(angle) * distance * t.value },
      // Le « + 40 t² » fait retomber les confettis comme sous l'effet de la gravité.
      { translateY: Math.sin(angle) * distance * t.value + 40 * t.value * t.value },
      { rotate: `${t.value * (index % 2 === 0 ? 300 : -240)}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        { width: largeur, height: largeur * 1.8, backgroundColor: COULEURS[index % COULEURS.length] },
        style,
      ]}
    />
  );
}

// 📖 Gerbe de confettis qui jaillit du médaillon, une seule fois. Décorative : ignorée
//    des lecteurs d'écran, et absente si « Réduire les animations » est activé.
export function Confettis() {
  const reduire = useReduireAnimations();
  if (reduire !== false) return null;

  return (
    <View style={styles.centre} pointerEvents="none" importantForAccessibility="no-hide-descendants">
      {Array.from({ length: NOMBRE }).map((_, index) => (
        <Confetti key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
});
