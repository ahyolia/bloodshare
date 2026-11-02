import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Rayon } from '../../constants/spacing';

type Props = {
  /** Numéro de la question affichée (à partir de 1). */
  numero: number;
  total: number;
};

// 📖 Barre fine d'avancement dans un quiz, sans libellé : le numéro est déjà écrit dans
//    le bloc de la question. La BarreProgression du design system, avec titre et
//    pourcentage, était trop lourde ici. Le remplissage glisse d'une question à l'autre
//    (withTiming suit « Réduire les animations »).
export function BarreQuestions({ numero, total }: Props) {
  const ratio = total > 0 ? Math.min(numero / total, 1) : 0;
  const progression = useSharedValue(ratio);

  useEffect(() => {
    progression.value = withTiming(ratio, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [progression, ratio]);

  const style = useAnimatedStyle(() => ({ width: `${progression.value * 100}%` }));

  return (
    <View
      style={styles.piste}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Avancement du quiz"
      accessibilityValue={{ min: 0, max: total, now: numero, text: `Question ${numero} sur ${total}` }}
    >
      <Animated.View style={[styles.remplissage, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  piste: {
    height: 6,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.bordure,
    overflow: 'hidden',
  },
  remplissage: {
    height: '100%',
    borderRadius: Rayon.plein,
    backgroundColor: Theme.info.icone,
  },
});
