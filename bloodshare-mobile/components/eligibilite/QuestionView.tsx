import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Question, Reponse, TOTAL_QUESTIONS } from '../../constants/eligibilite';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Bouton } from '../ui/Bouton';

type Props = {
  question: Question;
  numeroQuestion: number;
  peutRevenirArriere: boolean;
  onRepondre: (reponse: Reponse) => void;
  onRetour: () => void;
  onQuitter: () => void;
};

export function QuestionView({
  question,
  numeroQuestion,
  peutRevenirArriere,
  onRepondre,
  onRetour,
  onQuitter,
}: Props) {
  return (
    <View style={styles.screen}>
      {/* 📖 Le bouton retour de l'en-tête quitte toujours le questionnaire (les réponses
          restent en mémoire, on pourra reprendre). Revenir à la question précédente est
          une action à part, en bas : les deux étaient confondus, on ne pouvait pas sortir. */}
      <View style={styles.header}>
        <Pressable
          onPress={onQuitter}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quitter le questionnaire"
        >
          <Ionicons name="arrow-back" size={22} color={Theme.texte.principal} />
        </Pressable>

        <View
          style={styles.dots}
          accessibilityLabel={`Question ${numeroQuestion} sur ${TOTAL_QUESTIONS}`}
        >
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index < numeroQuestion - 1 && styles.dotFait,
                index === numeroQuestion - 1 && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.questionBlock}>
        <Text style={[Typo.legendeForte, styles.progressLabel]}>
          Question {numeroQuestion} sur {TOTAL_QUESTIONS}
        </Text>
        <Text style={[Typo.titre2, styles.questionTexte]} accessibilityRole="header">
          {question.texte}
        </Text>
        {question.sous_texte && (
          <Text style={[Typo.legende, styles.questionSousTexte]}>({question.sous_texte})</Text>
        )}
      </View>

      {/* 📖 Oui et Non ont le même style : aucune réponse ne doit sembler « la bonne ».
          « Je ne sais pas » renvoie vers le Don du Sang plutôt que de deviner. */}
      <View style={styles.answersBlock}>
        <Bouton libelle="Oui" variante="secondaire" onPress={() => onRepondre('oui')} />
        <Bouton libelle="Non" variante="secondaire" onPress={() => onRepondre('non')} />
        <Bouton libelle="Je ne sais pas" variante="discret" onPress={() => onRepondre('ne_sait_pas')} />

        {peutRevenirArriere && (
          <Bouton
            libelle="Question précédente"
            icone="arrow-undo-outline"
            variante="discret"
            onPress={onRetour}
          />
        )}

        <Text style={[Typo.legende, styles.disclaimer]}>
          {"Tes réponses ne sont ni enregistrées ni envoyées."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
    paddingHorizontal: Espace[6],
    paddingTop: 54,
    paddingBottom: Espace[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Espace[6],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Espace[2],
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginRight: 48,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.bordure,
  },
  dotFait: {
    backgroundColor: Theme.texte.desactive,
  },
  dotActive: {
    width: 9,
    height: 9,
    backgroundColor: Theme.texte.principal,
  },
  questionBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  progressLabel: {
    color: Theme.texte.secondaire,
    marginBottom: Espace[2],
  },
  questionTexte: {
    color: Theme.texte.principal,
  },
  questionSousTexte: {
    color: Theme.texte.secondaire,
    marginTop: Espace[2],
  },
  answersBlock: {
    gap: Espace[3],
  },
  disclaimer: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
    marginTop: Espace[2],
  },
});
