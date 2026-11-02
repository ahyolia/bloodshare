import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { entree, entreeSousPage } from '../../constants/animations';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE, type TeintePastille } from '../../constants/teintes';
import { Typo } from '../../constants/typography';

/**
 * Chiffre clé sur une carte légèrement inclinée comme les cartes de l'onboarding
 * (ex. « 3 / Dons »). À poser dans une ligne : chaque carte prend une part égale
 * de la largeur.
 *
 * 📖 Une information, pas un bouton : carte à plat (contour fin), sans ombre.
 *    Dans l'app, seul ce qui se touche est surélevé (voir `Ombre.flottante`).
 * 📖 Lue comme un tout (« 3 dons ») par les lecteurs d'écran.
 * 📖 L'inclinaison reste faible (≤ 3°) : décorative, elle ne doit pas gêner la lecture.
 */
type Props = {
  valeur: string;
  libelle: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  teinte: TeintePastille;
  inclinaison?: `${number}deg`;
  /**
   * Ordre d'apparition dans la cascade d'une page principale (voir `entree`).
   * Absent → sous-page : la carte apparaît en fondu avec le reste du contenu.
   */
  rang?: number;
};

export function CarteChiffre({ valeur, libelle, icone, teinte, inclinaison = '0deg', rang }: Props) {
  const couleurs = TEINTES_PASTILLE[teinte];

  // 📖 Deux vues : l'animation d'entrée pilote le `transform` de la vue
  //    extérieure ; posée sur la même vue, elle écraserait l'inclinaison.
  return (
    <Animated.View style={styles.conteneur} entering={rang === undefined ? entreeSousPage : entree(rang)}>
      <View
        style={[styles.carte, { transform: [{ rotate: inclinaison }] }]}
        accessible
        accessibilityLabel={`${valeur} ${libelle.toLowerCase()}`}
      >
        <View style={[styles.pastille, { backgroundColor: couleurs.fond }]}>
          <Ionicons name={icone} size={18} color={couleurs.icone} />
        </View>
        <Text style={[Typo.titre2, styles.valeur]} numberOfLines={1} adjustsFontSizeToFit>
          {valeur}
        </Text>
        <Text style={[Typo.legende, styles.libelle]} numberOfLines={1}>
          {libelle}
        </Text>
      </View>
    </Animated.View>
  );
}

const PASTILLE = 32;

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  carte: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Espace[1],
    padding: Espace[3],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espace[1],
  },
  valeur: { color: Theme.texte.principal },
  libelle: { color: Theme.texte.secondaire },
});
