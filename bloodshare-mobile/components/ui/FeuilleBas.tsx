import { useEffect, useRef, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Theme } from '../../constants/colors';
import { Espace, Ombre } from '../../constants/spacing';
import { Bouton } from './Bouton';

/**
 * Feuille qui monte du bas de l'écran (ex. détail d'un badge), avec un voile derrière.
 *
 * 📖 Pourquoi pas `<Modal animationType="slide">` : il fait glisser TOUT le contenu
 *    de la modale, voile compris, ce qui donne un fond sombre qui « monte » avec la
 *    feuille. Ici la modale native ne s'anime pas : le voile apparaît en fondu, sur
 *    place, et seule la feuille monte, avec une courbe qui ralentit à l'arrivée.
 * 📖 La fermeture rejoue l'animation à l'envers, PUIS prévient le parent (`onFermer`) :
 *    si le parent retirait la modale tout de suite, elle disparaîtrait d'un coup.
 * 📖 « Réduire les animations » activé : tout s'affiche et se ferme sans transition.
 */
type Props = {
  visible: boolean;
  /** Appelé une fois la feuille refermée : c'est là que le parent la retire. */
  onFermer: () => void;
  children: ReactNode;
  libelleFermer?: string;
};

// 📖 Assez pour cacher la feuille la plus haute sous le bord de l'écran au départ.
const DEPLACEMENT = 640;
const OUVERTURE = { duration: 320, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System };
const FERMETURE = { duration: 220, easing: Easing.in(Easing.cubic), reduceMotion: ReduceMotion.System };

export function FeuilleBas({ visible, onFermer, children, libelleFermer = 'Fermer' }: Props) {
  const progression = useSharedValue(0);
  // 📖 Un double appui pendant la fermeture ne doit pas prévenir le parent deux fois.
  const enFermeture = useRef(false);

  useEffect(() => {
    // 📖 Retirée par le parent sans passer par `fermer` : on repart de zéro, pour
    //    que la prochaine ouverture soit de nouveau animée.
    if (!visible) {
      progression.set(0);
      return;
    }
    enFermeture.current = false;
    progression.set(withTiming(1, OUVERTURE));
  }, [visible, progression]);

  const fermer = () => {
    if (enFermeture.current) return;
    enFermeture.current = true;
    progression.set(
      withTiming(0, FERMETURE, (fini) => {
        'worklet';
        if (fini) scheduleOnRN(onFermer);
      }),
    );
  };

  const styleVoile = useAnimatedStyle(() => ({ opacity: progression.get() }));
  const styleFeuille = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progression.get(), [0, 1], [DEPLACEMENT, 0]) }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={fermer}>
      <View style={styles.racine}>
        <Animated.View style={[StyleSheet.absoluteFill, styleVoile]}>
          <Pressable style={[StyleSheet.absoluteFill, styles.voile]} onPress={fermer} accessibilityLabel={libelleFermer} />
        </Animated.View>

        <Animated.View style={[styles.feuille, styleFeuille]} accessibilityViewIsModal>
          <View style={styles.poignee} />
          {children}
          <Bouton libelle={libelleFermer} onPress={fermer} style={styles.fermer} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  racine: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // 📖 Voile aubergine plutôt que noir : même teinte que les ombres de l'app.
  voile: {
    backgroundColor: 'rgba(62, 36, 48, 0.45)',
  },
  feuille: {
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[6],
    paddingTop: Espace[3],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Theme.fond.surface,
    ...Ombre.modale,
  },
  poignee: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.fond.bordure,
    marginBottom: Espace[3],
  },
  fermer: {
    alignSelf: 'stretch',
    marginTop: Espace[2],
  },
});
