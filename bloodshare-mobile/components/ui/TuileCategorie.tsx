import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE, type TeintePastille } from '../../constants/teintes';
import { Typo } from '../../constants/typography';

type Props = {
  titre: string;
  /** Sous le titre, ex. « 3 quiz » ou « 2 fiches ». */
  sousTitre: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  teinte: TeintePastille;
  selectionnee: boolean;
  onPress: () => void;
};

// Inclinaison de la tuile choisie, comme les cartes chiffres du Profil (≤ 3°).
const INCLINAISON = -3;

// 📖 Tuile de catégorie (quiz, fiches pratiques), dans une rangée qui défile à
//    l'horizontale. La grande icône en bas à droite tient lieu d'illustration, en
//    attendant des dessins dédiés.
//    Sélection sans encadré : la tuile choisie pivote légèrement et se soulève, avec un
//    ressort qui la fait un peu balancer (withSpring suit « Réduire les animations »).
export function TuileCategorie({ titre, sousTitre, icone, teinte, selectionnee, onPress }: Props) {
  const couleurs = TEINTES_PASTILLE[teinte];
  const actif = useSharedValue(selectionnee ? 1 : 0);

  useEffect(() => {
    actif.value = withSpring(selectionnee ? 1 : 0, { damping: 8, stiffness: 140 });
  }, [actif, selectionnee]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * actif.value }, { rotate: `${INCLINAISON * actif.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.cadre, selectionnee && styles.ombre, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${titre}, ${sousTitre}`}
        accessibilityState={{ selected: selectionnee }}
        style={({ pressed }) => [styles.tuile, { backgroundColor: couleurs.fond }, pressed && styles.presse]}
      >
        <Text style={[Typo.corpsFort, styles.titre]} numberOfLines={2}>
          {titre}
        </Text>
        <Text style={[Typo.legende, styles.nombre]}>{sousTitre}</Text>
        <View style={styles.illustration} accessible={false}>
          <Ionicons name={icone} size={52} color={couleurs.icone} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    borderRadius: Rayon.lg,
  },
  ombre: {
    ...Ombre.flottante,
  },
  tuile: {
    width: 150,
    height: 132,
    borderRadius: Rayon.lg,
    padding: Espace[3],
    overflow: 'hidden',
    // 📖 Sur le web, le contour de focus du navigateur redessinait un encadré après un
    //    clic. La sélection se voit déjà (inclinaison) et est annoncée (`selected`).
    outlineWidth: 0,
  },
  presse: { opacity: 0.85 },
  titre: {
    color: Theme.texte.principal,
  },
  nombre: {
    color: Theme.texte.principal,
    marginTop: 2,
  },
  illustration: {
    position: 'absolute',
    right: Espace[2],
    bottom: Espace[2],
    opacity: 0.9,
  },
});
