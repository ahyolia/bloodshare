import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { TEINTES_VIVES, type TeintePastille } from '../../constants/teintes';
import { Typo } from '../../constants/typography';

type NomIcone = ComponentProps<typeof Ionicons>['name'];

type Props = {
  titre: string;
  teinte: TeintePastille;
  /** Grande icône en filigrane, qui sort par le coin. */
  icone: NomIcone;
  /** Pilules blanches au-dessus du titre (date, « Demain »…). */
  pilules: { icone: NomIcone; texte: string }[];
  /** Photo envoyée depuis le backoffice : affichée en haut du bloc. */
  imageUrl?: string;
};

// 📖 En-tête des pages Actualité et Événement, pris sur celui des fiches pratiques :
//    pastel de la teinte, grande icône en filigrane, pilules blanches et titre. À plat,
//    sans ombre : il ne se touche pas. Aubergine sur pastel : ≥ 7:1.
export function EnTeteContenu({ titre, teinte, icone, pilules, imageUrl }: Props) {
  return (
    <View style={styles.entete}>
      <View style={[StyleSheet.absoluteFill, styles.teinte, { backgroundColor: TEINTES_VIVES[teinte] }]} />
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.forme} accessible={false} importantForAccessibility="no-hide-descendants">
          <Ionicons name={icone} size={150} color={TEINTES_VIVES[teinte]} />
        </View>
      )}

      <View style={styles.textes}>
        <View style={styles.pilules}>
          {pilules.map((pilule) => (
            <View key={pilule.texte} style={styles.pilule}>
              <Ionicons name={pilule.icone} size={14} color={Theme.texte.principal} />
              <Text style={[Typo.legendeForte, styles.texte]}>{pilule.texte}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.titre, !imageUrl && styles.titreLimite]} accessibilityRole="header">
          {titre}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entete: {
    borderRadius: Rayon.lg,
    overflow: 'hidden',
    backgroundColor: Theme.fond.surface,
  },
  // Couleur vive à 22 % sur du blanc, comme l'en-tête des fiches.
  teinte: { opacity: 0.22 },
  image: { width: '100%', height: 190 },
  forme: {
    position: 'absolute',
    right: -30,
    bottom: -36,
    opacity: 0.3,
    transform: [{ rotate: '-12deg' }],
  },
  textes: {
    gap: Espace[3],
    padding: Espace[6] - Espace[1],
  },
  pilules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espace[2],
  },
  pilule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Espace[2],
    paddingVertical: 4,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
  },
  texte: { color: Theme.texte.principal },
  titre: {
    ...Typo.titre2,
    fontSize: 26,
    lineHeight: 32,
    color: Theme.texte.principal,
  },
  // Laisse respirer l'icône à droite.
  titreLimite: { maxWidth: '88%' },
});
