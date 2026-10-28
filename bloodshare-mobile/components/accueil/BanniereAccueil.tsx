import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Palette } from '../../constants/palette';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { useReduireAnimations } from '../../hooks/useReduireAnimations';
import type { Banniere, TypeBanniere } from '../../services/bannieres.service';

const APPARENCE: Record<
  TypeBanniere,
  { fond: string; pastille: string; icone: ComponentProps<typeof Ionicons>['name']; couleurIcone: string; lu: string }
> = {
  info: {
    fond: Theme.info.surface,
    pastille: Theme.info.icone,
    icone: 'information',
    couleurIcone: Palette.neutre.blanc,
    lu: 'Information',
  },
  alerte: {
    fond: Theme.etat.bas.surface,
    pastille: Theme.etat.bas.jauge,
    icone: 'warning',
    couleurIcone: Theme.texte.principal,
    lu: 'Alerte',
  },
  urgence: {
    fond: Theme.etat.critique.surface,
    pastille: Theme.etat.critique.jauge,
    icone: 'alert',
    couleurIcone: Palette.neutre.blanc,
    lu: 'Urgence',
  },
};

const PASTILLE = 40;

// 📖 Message du backoffice (pénurie, information…), en tête de l'accueil. Il informe :
//    bloc à plat, sans ombre (seul ce qui se touche est surélevé). Le type se lit à la
//    couleur, à l'icône ET au libellé lu par les lecteurs d'écran.
//    Une urgence a un halo qui s'élargit autour de son icône, sauf si « Réduire les
//    animations » est activé.
export function BanniereAccueil({ banniere }: { banniere: Banniere }) {
  const apparence = APPARENCE[banniere.type] ?? APPARENCE.info;
  const urgence = banniere.type === 'urgence';
  const reduire = useReduireAnimations();

  const halo = useSharedValue(0);
  useEffect(() => {
    if (!urgence || reduire !== false) return;
    halo.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(halo);
  }, [halo, reduire, urgence]);
  const styleHalo = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - halo.value),
    transform: [{ scale: 1 + halo.value * 0.7 }],
  }));

  return (
    <View
      style={[styles.banniere, { backgroundColor: apparence.fond }]}
      accessible
      accessibilityRole={urgence ? 'alert' : undefined}
      accessibilityLabel={`${apparence.lu}. ${banniere.titre}. ${banniere.message}`}
    >
      <View style={styles.cadrePastille}>
        {urgence && <Animated.View style={[styles.halo, { backgroundColor: apparence.pastille }, styleHalo]} />}
        <View style={[styles.pastille, { backgroundColor: apparence.pastille }]}>
          <Ionicons name={apparence.icone} size={22} color={apparence.couleurIcone} />
        </View>
      </View>

      <View style={styles.textes}>
        <Text style={[Typo.corpsFort, styles.titre]}>{banniere.titre}</Text>
        <Text style={[Typo.legende, styles.titre]}>{banniere.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banniere: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[4],
    borderRadius: Rayon.lg,
  },
  cadrePastille: {
    width: PASTILLE,
    height: PASTILLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.plein,
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 2 },
  titre: { color: Theme.texte.principal },
});
