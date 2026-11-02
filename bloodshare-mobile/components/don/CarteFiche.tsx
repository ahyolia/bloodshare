import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { categorieFiche } from '../../constants/fiches';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE, TEINTES_VIVES } from '../../constants/teintes';
import { Typo } from '../../constants/typography';
import type { FicheInfo } from '../../services/fichesInfos.service';
import { tempsLecture } from '../../utils/tempsLecture';

type Props = {
  fiche: FicheInfo;
  onPress: () => void;
};

// 📖 Carte d'une fiche pratique, deux par ligne sur la page Don : fond pastel de sa
//    catégorie et, en grand derrière, l'icône pleine de la catégorie dans sa couleur
//    vive (des personnes pour l'éligibilité, une goutte pour le don…) : la forme dit de
//    quoi parle la fiche. Puis la durée dans une pilule blanche et le titre, rien de plus :
//    le quiz lié est proposé dans la fiche, et une pastille d'icône ou une pilule de plus
//    alourdissaient la carte. Texte aubergine sur pastel : contraste ≥ 9:1.
export function CarteFiche({ fiche, onPress }: Props) {
  const categorie = categorieFiche(fiche.categorie);
  const minutes = tempsLecture(fiche.contenu);
  const avecQuiz = (fiche.quiz_lies?.length ?? 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${fiche.titre}, ${minutes} min de lecture${avecQuiz ? ', avec un quiz' : ''}`}
      style={({ pressed }) => [styles.carte, pressed && styles.presse]}
    >
      {/* overflow: hidden sur une vue intérieure : la forme est rognée, pas l'ombre de la carte. */}
      <View style={[styles.interieur, { backgroundColor: TEINTES_PASTILLE[categorie.teinte].fond }]}>
        <View style={styles.forme} accessible={false}>
          <Ionicons name={categorie.iconePleine} size={110} color={TEINTES_VIVES[categorie.teinte]} />
        </View>

        <View style={styles.pilule}>
          <Text style={[Typo.legendeForte, styles.piluleTexte]}>{minutes} min</Text>
        </View>

        <Text style={[Typo.corpsFort, styles.titre]} numberOfLines={3}>
          {fiche.titre}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    flex: 1,
    borderRadius: Rayon.lg,
    ...Ombre.flottante,
  },
  presse: { transform: [{ scale: 0.97 }] },
  // 📖 flex: 1 : dans une ligne de la grille, la carte la plus courte s'étire à la hauteur
  //    de sa voisine ; sans lui, le fond et l'icône s'arrêtaient avant le bas de la carte.
  interieur: {
    flex: 1,
    minHeight: 150,
    padding: Espace[3],
    gap: Espace[3],
    borderRadius: Rayon.lg,
    overflow: 'hidden',
  },
  // Sort par le coin bas droit, légèrement penchée : un sticker posé sur la carte.
  forme: {
    position: 'absolute',
    right: -26,
    bottom: -26,
    opacity: 0.3,
    transform: [{ rotate: '-12deg' }],
  },
  pilule: {
    alignSelf: 'flex-start',
    paddingHorizontal: Espace[2],
    paddingVertical: 4,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
  },
  piluleTexte: { color: Theme.texte.principal },
  titre: { color: Theme.texte.principal },
});
