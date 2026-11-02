import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View, type ViewStyle } from 'react-native';
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

// Gouttes du bandeau Don (le sang, sujet de la page), sur pétrole foncé : toutes en
// corail. Transparence légère seulement : plus transparent, le corail se mélange au
// pétrole (couleurs opposées) et vire au gris.
const GOUTTES: Cercle[] = [
  { style: { width: 150, height: 150, right: -36, bottom: -50 }, couleur: Palette.corail[500], opacite: 0.85, dx: -12, dy: -10, duree: 4400 },
  { style: { width: 60, height: 60, right: 92, top: -14 }, couleur: Palette.corail[500], opacite: 0.85, dx: 14, dy: 12, duree: 3500 },
  { style: { width: 30, height: 30, left: '56%', bottom: 16 }, couleur: Palette.corail[500], opacite: 0.85, dx: 8, dy: -12, duree: 2900 },
];

function CercleFlottant({ cercle, goutte }: { cercle: Cercle; goutte: boolean }) {
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

  if (goutte) {
    // 📖 Goutte dessinée (pas l'icône, dont le reflet intérieur ressortait mal) : un
    //    carré arrondi sauf un coin, tourné à 45° dans une vue intérieure pour ne pas
    //    écraser l'animation de la vue extérieure.
    const taille = Number(cercle.style.width);
    return (
      <Animated.View style={[styles.forme, cercle.style, { opacity: cercle.opacite }, style]}>
        <View
          style={[
            styles.goutte,
            { width: taille * 0.72, height: taille * 0.72, backgroundColor: cercle.couleur },
          ]}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.forme, styles.cercle, cercle.style, { backgroundColor: cercle.couleur, opacity: cercle.opacite }, style]}
    />
  );
}

// 📖 Formes de couleur des bandeaux, qui flottent doucement : des cercles (Quiz) ou des
//    gouttes (Don), pour que chaque page ait son caractère. Décoratives : ignorées des
//    lecteurs d'écran, et immobiles si « Réduire les animations » est activé.
export function DecorBandeau({ forme = 'cercle' }: { forme?: 'cercle' | 'goutte' }) {
  const formes = forme === 'goutte' ? GOUTTES : CERCLES;
  return (
    <>
      {formes.map((cercle, index) => (
        <CercleFlottant key={index} cercle={cercle} goutte={forme === 'goutte'} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  forme: {
    position: 'absolute',
  },
  cercle: {
    borderRadius: Rayon.plein,
  },
  // Pointe vers le haut : le coin non arrondi, une fois tourné de 45°.
  goutte: {
    alignSelf: 'center',
    marginTop: '15%',
    borderRadius: Rayon.plein,
    borderTopLeftRadius: 0,
    transform: [{ rotate: '45deg' }],
  },
});
