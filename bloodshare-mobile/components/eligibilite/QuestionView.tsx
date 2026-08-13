import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Question } from '../../constants/eligibilite';

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
  progression,
  peutRevenirArriere,
  onRepondre,
  onRetour,
  onQuitter,
}: Props) {
  // 📖 widthAnim garde la valeur de largeur animée en mémoire entre les rendus (useRef évite de la recréer à chaque render)
  const widthAnim = useRef(new Animated.Value(0)).current;

  // 📖 À chaque changement de `progression`, on anime la largeur de la barre vers sa nouvelle valeur au lieu de la changer d'un coup
  // → Si on ne le faisait pas : la barre passerait de 6% à 13% instantanément à chaque réponse, sans transition visuelle
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progression,
      duration: 300,
      useNativeDriver: false, // 📖 la largeur (%) n'est pas une propriété animable par le driver natif, on reste sur le JS driver
    }).start();
  }, [progression]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {peutRevenirArriere ? (
          <TouchableOpacity onPress={onRetour} style={styles.headerButton} accessibilityRole="button">
            <Text style={styles.headerButtonText}>← Retour</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
        <TouchableOpacity onPress={onQuitter} style={styles.headerButton} accessibilityRole="button">
          <Text style={styles.headerButtonText}>✕ Quitter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>Question {numeroQuestion} sur 15</Text>

      <View style={styles.questionBlock}>
        <Text style={styles.questionTexte}>{question.texte}</Text>
        {question.sous_texte && <Text style={styles.questionSousTexte}>{question.sous_texte}</Text>}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerButtonText: {
    color: Colors.aubergine,
    fontSize: 15,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E1D8',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.corail[600],
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.grisMoyen,
    textAlign: 'center',
  },
  questionBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  questionTexte: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    marginTop: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  questionSousTexte: {
    fontStyle: 'italic',
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
  },
  answersBlock: {
    gap: 12,
  },
  buttonOui: {
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.aubergine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOuiText: {
    color: Colors.blanc,
    fontWeight: '700',
    fontSize: 17,
  },
  buttonNon: {
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.blanc,
    borderWidth: 2,
    borderColor: Colors.aubergine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonNonText: {
    color: Colors.aubergine,
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
