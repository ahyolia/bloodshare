import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Question } from '../../constants/eligibilite';

const TOTAL_QUESTIONS = 15;

type Props = {
  question: Question;
  numeroQuestion: number;
  progression: number;
  peutRevenirArriere: boolean;
  onRepondre: (reponse: 'oui' | 'non') => void;
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={peutRevenirArriere ? onRetour : onQuitter}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.aubergine} />
        </TouchableOpacity>

        <View style={styles.dots}>
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === numeroQuestion - 1 ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.questionBlock}>
        <Text style={styles.questionTexte}>{question.texte}</Text>
        {question.sous_texte && <Text style={styles.questionSousTexte}>{question.sous_texte}</Text>}
        <Text style={styles.progressLabel}>
          Question {numeroQuestion} sur {TOTAL_QUESTIONS}
        </Text>
      </View>

      <View style={styles.answersBlock}>
        <TouchableOpacity
          style={styles.buttonOui}
          onPress={() => onRepondre('oui')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonOuiText}>Oui</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonNon}
          onPress={() => onRepondre('non')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonNonText}>Non</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>Aucune donnée n'est enregistrée.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginRight: 42,
  },
  dot: {
    borderRadius: 5,
  },
  dotActive: {
    width: 9,
    height: 9,
    backgroundColor: Colors.aubergine,
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: '#D8D3CA',
  },
  questionBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  questionTexte: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.aubergine,
    lineHeight: 30,
  },
  questionSousTexte: {
    fontStyle: 'italic',
    color: Colors.grisMoyen,
    fontSize: 14,
    marginTop: 6,
  },
  progressLabel: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.grisMoyen,
  },
  answersBlock: {
    gap: 12,
  },
  buttonOui: {
    height: 56,
    borderRadius: 20,
    backgroundColor: '#E2DFD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOuiText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 17,
  },
  buttonNon: {
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.aubergine,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonNonText: {
    color: Colors.cremeClair,
    fontWeight: '700',
    fontSize: 17,
  },
  disclaimer: {
    color: Colors.grisMoyen,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
