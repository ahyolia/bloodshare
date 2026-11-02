import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Palette } from '../../constants/palette';
import { apparenceCategorie } from '../../constants/quiz';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE } from '../../constants/teintes';
import { Typo } from '../../constants/typography';
import type { QuizItem } from '../../services/quiz.service';
import { accorder } from '../../utils/pluriel';
import { etatQuiz, type EtatQuiz } from '../../utils/quizAccueil';

type Props = {
  quiz: QuizItem;
  categorie: string;
  onPress: () => void;
};

const ETIQUETTE: Record<EtatQuiz['statut'], { fond: string; texte: string }> = {
  a_faire: { fond: Theme.fond.surfaceEnfoncee, texte: Theme.texte.secondaire },
  en_cours: { fond: Palette.orange[100], texte: Theme.texte.principal },
  termine: { fond: Theme.feedback.succesSurface, texte: Theme.feedback.succesTexte },
};

const libelleEtat = (etat: EtatQuiz) => {
  switch (etat.statut) {
    case 'a_faire':
      return 'À faire';
    // 📖 L'avancement est déjà montré par la barre sous le titre.
    case 'en_cours':
      return 'En cours';
    case 'termine':
      return `Terminé · ${etat.score}/${etat.total}`;
  }
};

// 📖 Ligne d'un quiz : pastille de sa catégorie, titre, nombre de questions et points,
//    et une étiquette d'état. Un quiz en cours montre aussi sa progression.
export function LigneQuiz({ quiz, categorie, onPress }: Props) {
  const { icone, teinte } = apparenceCategorie(categorie);
  const pastille = TEINTES_PASTILLE[teinte];
  const etat = etatQuiz(quiz);
  const etiquette = ETIQUETTE[etat.statut];
  const libelle = libelleEtat(etat);
  const details = `${quiz.nb_questions} ${accorder(quiz.nb_questions, 'question')} · ${quiz.points_attribues} points`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${quiz.titre}, ${details}, ${libelle}${
        etat.statut === 'en_cours' ? `, ${etat.repondues} sur ${etat.total}` : ''
      }`}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}
    >
      <View style={[styles.pastille, { backgroundColor: pastille.fond }]}>
        <Ionicons name={icone} size={22} color={pastille.icone} />
      </View>

      <View style={styles.textes}>
        <Text style={[Typo.corpsFort, styles.titre]} numberOfLines={2}>
          {quiz.titre}
        </Text>
        <Text style={[Typo.legende, styles.details]}>{details}</Text>
        {etat.statut === 'en_cours' && (
          <View style={styles.piste}>
            <View style={[styles.remplissage, { width: `${(etat.repondues / etat.total) * 100}%` }]} />
          </View>
        )}
      </View>

      <View style={[styles.etiquette, { backgroundColor: etiquette.fond }]}>
        <Text style={[Typo.legendeForte, { color: etiquette.texte }]}>{libelle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    minHeight: 76,
    paddingHorizontal: Espace[4],
    paddingVertical: Espace[3],
    backgroundColor: Theme.fond.surface,
    borderRadius: Rayon.lg,
    // 📖 Surélevé = interactif : chaque ligne ouvre un quiz.
    ...Ombre.flottante,
  },
  presse: { opacity: 0.85 },
  pastille: {
    width: 48,
    height: 48,
    borderRadius: Rayon.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 2 },
  titre: { color: Theme.texte.principal },
  details: { color: Theme.texte.secondaire },
  piste: {
    height: 4,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.bordure,
    marginTop: Espace[1],
    overflow: 'hidden',
  },
  remplissage: {
    height: 4,
    backgroundColor: Theme.action.primaire,
  },
  etiquette: {
    borderRadius: Rayon.plein,
    paddingHorizontal: Espace[2],
    paddingVertical: 2,
  },
});
