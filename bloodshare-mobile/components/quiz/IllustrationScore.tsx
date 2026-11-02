import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Palette } from '../../constants/palette';
import { Rayon } from '../../constants/spacing';
import { useReduireAnimations } from '../../hooks/useReduireAnimations';
import { Confettis } from './Confettis';

type Props = {
  icone: ComponentProps<typeof Ionicons>['name'];
  /** Gerbe de confettis (bon résultat). */
  festif?: boolean;
};

const LARGEUR = 220;
const HAUTEUR = 200;

// 📖 Pas de corail ici : dans l'app il signale ce qui demande l'attention. La fête passe
//    par le lime (couleur signature), l'orange et le pétrole.
//    x / y : position finale du coin haut gauche (px) ; dx / dy / duree : flottement.
//    Flottement volontairement lent et ample de 2 à 3 px seulement : un mouvement plus
//    rapide ou plus grand donnait une impression d'agitation, presque de pression.
const ETOILES = [
  { x: 40, y: 8, taille: 22, couleur: Palette.orange[500], dx: 2, dy: -3, duree: 6200 },
  { x: 136, y: 0, taille: 16, couleur: Palette.lime[500], dx: -3, dy: 2, duree: 5600 },
  { x: 193, y: 60, taille: 20, couleur: Palette.orange[500], dx: -2, dy: -3, duree: 6800 },
  { x: 189, y: 140, taille: 14, couleur: Palette.petrole[500], dx: 3, dy: 2, duree: 5900 },
  { x: 66, y: 168, taille: 18, couleur: Palette.lime[500], dx: -2, dy: 3, duree: 6500 },
  { x: 4, y: 112, taille: 16, couleur: Palette.petrole[500], dx: 3, dy: -2, duree: 6000 },
] as const;

function Etoile({ etoile, index }: { etoile: (typeof ETOILES)[number]; index: number }) {
  const reduire = useReduireAnimations();
  // 0 → l'étoile est encore dans le médaillon ; 1 → posée à sa place.
  const sortie = useSharedValue(0);
  const flottement = useSharedValue(0);

  // Décalage entre la place finale et le centre du médaillon, d'où l'étoile jaillit.
  const departX = LARGEUR / 2 - etoile.taille / 2 - etoile.x;
  const departY = HAUTEUR / 2 - etoile.taille / 2 - etoile.y;

  useEffect(() => {
    if (reduire === null) return;
    if (reduire) {
      sortie.value = 1;
      return;
    }

    // Gerbe : chaque étoile part du centre, avec un léger décalage, et dépasse un peu
    // sa place avant de s'y poser (courbe « back »), comme un confetti lancé.
    sortie.value = withDelay(
      200 + index * 60,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.back(1.6)) })
    );
    // Puis elle flotte sans fin, comme les cercles du bandeau des quiz.
    flottement.value = withDelay(
      950 + index * 60,
      withRepeat(withTiming(1, { duration: etoile.duree, easing: Easing.inOut(Easing.sin) }), -1, true)
    );

    return () => {
      cancelAnimation(sortie);
      cancelAnimation(flottement);
    };
  }, [etoile.duree, flottement, index, reduire, sortie]);

  const style = useAnimatedStyle(() => {
    const reste = 1 - sortie.value;
    return {
      opacity: Math.min(sortie.value * 2, 1),
      transform: [
        { translateX: departX * reste + etoile.dx * flottement.value },
        { translateY: departY * reste + etoile.dy * flottement.value },
        { rotate: `${reste * (index % 2 === 0 ? 300 : -300)}deg` },
        { scale: 0.4 + 0.6 * sortie.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.etoile, { left: etoile.x, top: etoile.y }, style]}>
      <Ionicons name="star" size={etoile.taille} color={etoile.couleur} />
    </Animated.View>
  );
}

// 📖 Médaillon festif de l'écran score : décoratif, ignoré des lecteurs d'écran (le
//    score est annoncé juste en dessous). Si « Réduire les animations » est activé, les
//    étoiles sont directement à leur place et ne bougent pas.
export function IllustrationScore({ icone, festif = false }: Props) {
  return (
    <View style={styles.cadre} accessible={false} importantForAccessibility="no-hide-descendants">
      {festif && <Confettis />}

      <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.anneau}>
        <Animated.View entering={ZoomIn.delay(180).springify().damping(9)} style={styles.medaillon}>
          <Ionicons name={icone} size={56} color={Theme.texte.principal} />
        </Animated.View>
      </Animated.View>

      {/* Après le médaillon dans l'ordre d'affichage : les étoiles en sortent par-dessus. */}
      {ETOILES.map((etoile, index) => (
        <Etoile key={index} etoile={etoile} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    width: LARGEUR,
    height: HAUTEUR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etoile: {
    position: 'absolute',
  },
  anneau: {
    width: 160,
    height: 160,
    borderRadius: Rayon.plein,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.mousse[600],
    backgroundColor: Theme.fond.pastilleMousse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medaillon: {
    width: 108,
    height: 108,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
