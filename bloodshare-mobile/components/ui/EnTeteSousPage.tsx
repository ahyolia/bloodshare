import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Ombre } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * En-tête des sous-pages (Profil › Mes badges, Paramètres…) : bouton retour rond
 * et flottant, titre de la page.
 *
 * 📖 Volontairement sans sous-titre : un chiffre y répétait celui de la page, et
 *    une consigne se lit mieux comme texte d'introduction, dans le contenu.
 *
 * 📖 Le bouton retour fait 44 px + hitSlop : cible tactile ≥ 48 px (WCAG AA).
 * 📖 Le titre est annoncé comme en-tête : un lecteur d'écran sait où il est arrivé.
 */
type Props = {
  titre: string;
  /** Remplace le simple « écran précédent » (ex. lien direct sans historique). */
  onRetour?: () => void;
  /** Libellé du bouton retour pour les lecteurs d'écran, si « Retour » ne suffit pas. */
  libelleRetour?: string;
};

const BOUTON = 44;

/** « /tabs/profil/points » → « /tabs/profil » ; « /notifications » → « / ». */
export const pageParente = (chemin: string) => chemin.replace(/\/[^/]+\/?$/, '') || '/';

export function EnTeteSousPage({ titre, onRetour, libelleRetour = 'Retour' }: Props) {
  const router = useRouter();
  const chemin = usePathname();

  // 📖 Sans historique (page rechargée sur le web, lien direct), `back()` ne fait
  //    rien : on remonte alors à la page parente.
  const retour = () => (router.canGoBack() ? router.back() : router.replace(pageParente(chemin) as Href));

  return (
    <View style={styles.enTete}>
      <Pressable
        onPress={onRetour ?? retour}
        hitSlop={2}
        accessibilityRole="button"
        accessibilityLabel={libelleRetour}
        style={({ pressed }) => [styles.retour, pressed && styles.presse]}
      >
        <Ionicons name="chevron-back" size={22} color={Theme.texte.principal} />
      </Pressable>

      <Text style={[Typo.titre2, styles.titre]} accessibilityRole="header" numberOfLines={2}>
        {titre}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  enTete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    marginBottom: Espace[6],
  },
  retour: {
    width: BOUTON,
    height: BOUTON,
    borderRadius: BOUTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  presse: { opacity: 0.8 },
  titre: { flex: 1, color: Theme.texte.principal },
});
