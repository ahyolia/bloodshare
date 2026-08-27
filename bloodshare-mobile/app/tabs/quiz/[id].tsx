import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { TAB_BAR_STYLE } from '../_layout';
import {
  getQuizDetail,
  Question,
  QuizDetail,
  ReponsePayload,
  submitQuiz,
} from '../../../services/quiz.service';

export default function QuizDeroulementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);

  // 📖 Map<question_id, reponse_ids sélectionnés> : source de vérité unique de toutes les
  //    réponses données, quelle que soit la question affichée à l'écran
  // → Pourquoi une Map et pas un objet : accès O(1) par id de question, et Map.set/delete
  //   retournent naturellement un nouvel objet immuable compatible avec setState
  const [reponses, setReponses] = useState<Map<number, number[]>>(new Map());

  const progressAnim = useRef(new Animated.Value(0)).current;

  // 📖 Timer d'auto-avance (questions à choix unique) : gardé dans un ref pour pouvoir
  //    l'annuler si l'utilisateur re-tape une autre réponse ou quitte l'écran avant la fin du délai
  const autoAvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 📖 Drapeau synchrone : passé à true AVANT le router.replace vers l'écran score. Le listener
  //    `beforeRemove` le lit tout de suite, alors que le state `submitting` ne serait committé
  //    qu'au rendu suivant → sans ce ref, quitter [id] pour aller vers /score déclenchait la
  //    modale « Abandonner le quiz ? » au lieu de laisser passer la navigation.
  const soumissionEnCours = useRef(false);

  // 📖 Idem pour l'abandon confirmé : une fois que l'utilisateur a dit « Abandonner », on
  //    laisse passer le `navigation.dispatch` sans réafficher la modale (sinon 2 confirmations).
  const sortieConfirmee = useRef(false);

  const annulerAutoAvance = () => {
    if (autoAvanceTimer.current) {
      clearTimeout(autoAvanceTimer.current);
      autoAvanceTimer.current = null;
    }
  };

  useEffect(() => annulerAutoAvance, []);

  // 📖 Pendant le déroulement du quiz, on masque la tab bar flottante : sinon elle recouvre
  //    le footer (boutons Précédent / Suivant / Terminer). On la restaure en quittant l'écran.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  useEffect(() => {
    let cancelled = false;

    getQuizDetail(Number(id))
      .then((data) => {
        if (!cancelled) setQuiz(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!quiz) return;

    // 📖 timing (durée fixe, pas de rebond) convient à une barre de progression : elle doit
    //    avancer de façon régulière et prévisible, contrairement à un effet "pop" (spring)
    Animated.timing(progressAnim, {
      toValue: (questionIndex + 1) / quiz.questions.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [questionIndex, quiz, progressAnim]);

  // 📖 Point d'interception UNIQUE pour toute sortie de l'écran (bouton back custom, geste natif
  //    Android, bouton matériel) : on ne montre la confirmation d'abandon qu'ici, une seule fois.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Soumission en cours ou abandon déjà confirmé → on laisse la navigation se faire
      if (soumissionEnCours.current || sortieConfirmee.current) return;

      e.preventDefault();
      Alert.alert('Abandonner le quiz ?', 'Votre progression sera perdue.', [
        { text: 'Continuer le quiz', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: () => {
            sortieConfirmee.current = true;
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [navigation]);

  const toggleReponse = (question: Question, reponseId: number) => {
    setReponses((prev) => {
      const next = new Map(prev);

      if (question.type === 'unique') {
        next.set(question.id, [reponseId]);
        return next;
      }

      const actuelles = next.get(question.id) ?? [];
      const dejaSelectionnee = actuelles.includes(reponseId);
      next.set(
        question.id,
        dejaSelectionnee
          ? actuelles.filter((id) => id !== reponseId)
          : [...actuelles, reponseId]
      );
      return next;
    });

    // 📖 Auto-avance sur les questions à choix unique : la réponse suffit à valider, on
    //    enchaîne après 350 ms pour laisser voir la sélection. Les questions 'multiple'
    //    et la dernière question gardent la validation manuelle par bouton.
    const estDerniere = quiz ? questionIndex === quiz.questions.length - 1 : true;
    if (question.type === 'unique' && !estDerniere) {
      annulerAutoAvance();
      autoAvanceTimer.current = setTimeout(() => {
        setQuestionIndex((prev) => prev + 1);
      }, 350);
    }
  };

  const handleSuivant = () => {
    if (!quiz) return;

    annulerAutoAvance();

    if (questionIndex < quiz.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      handleSoumettre();
    }
  };

  const handleSoumettre = async () => {
    if (!quiz) return;

    annulerAutoAvance();
    soumissionEnCours.current = true;
    setSubmitting(true);

    try {
      // 📖 Notre Map interne (accès rapide par question_id) n'a pas de forme JSON native :
      //    on la convertit ici vers le tableau attendu par l'API au moment de l'envoi
      const reponsesPayload: ReponsePayload[] = Array.from(reponses.entries()).map(
        ([question_id, reponse_ids]) => ({ question_id, reponse_ids })
      );

      const resultat = await submitQuiz(quiz.id, reponsesPayload);

      // 📖 replace : on ne veut pas qu'un retour arrière depuis l'écran score ramène sur le
      //    quiz déjà soumis (même logique que resultat-scan → cartes/accueil)
      router.replace({
        pathname: '/tabs/quiz/score',
        params: {
          quiz_id: String(quiz.id),
          quiz_titre: quiz.titre,
          score: String(resultat.score),
          total_questions: String(resultat.total_questions),
          points_gagnes: String(resultat.points_gagnes),
          premiere_completion: String(resultat.premiere_completion),
        },
      });
    } catch {
      // 📖 Échec de l'envoi : on reste sur le quiz, donc on réarme la confirmation d'abandon
      soumissionEnCours.current = false;
      Alert.alert('Erreur', 'Impossible de soumettre le quiz. Vérifiez votre connexion.', [
        { text: 'OK' },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.corail[600]} size="large" />
      </View>
    );
  }

  if (error || !quiz) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Impossible de charger ce quiz.</Text>
      </View>
    );
  }

  const question = quiz.questions[questionIndex];
  const reponsesSelectionnees = reponses.get(question.id) ?? [];
  const derniereQuestion = questionIndex === quiz.questions.length - 1;
  const peutContinuer = reponsesSelectionnees.length > 0;

  // 📖 Un seul mécanisme d'avancement par type de question :
  //    - choix unique (hors dernière) → auto-avance à la sélection, PAS de bouton (sinon doublon)
  //    - choix multiple → bouton « Suivant » manuel (on laisse cocher plusieurs cases avant de valider)
  //    - dernière question (quel que soit le type) → bouton « Terminer ✓ » manuel
  const afficherBoutonSuivant = question.type === 'multiple' || derniereQuestion;
  const afficherFooter = questionIndex > 0 || afficherBoutonSuivant;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {quiz.titre}
          </Text>

          <View style={styles.backButtonSpacer} />
        </View>

        <Text style={styles.progressLabel}>
          Question {questionIndex + 1} sur {quiz.questions.length}
        </Text>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intitule}>{question.intitule}</Text>

        {question.type === 'multiple' && (
          <Text style={styles.multipleHint}>(Plusieurs réponses possibles)</Text>
        )}

        {question.reponses.map((reponse) => {
          const selectionnee = reponsesSelectionnees.includes(reponse.id);

          return (
            <TouchableOpacity
              key={reponse.id}
              style={[styles.reponseCard, selectionnee && styles.reponseCardSelectionnee]}
              onPress={() => toggleReponse(question, reponse.id)}
              activeOpacity={0.85}
            >
              {question.type === 'unique' ? (
                <View style={[styles.radio, selectionnee && styles.radioSelectionne]}>
                  {selectionnee && <View style={styles.radioInterieur} />}
                </View>
              ) : (
                <View style={[styles.checkbox, selectionnee && styles.checkboxSelectionne]}>
                  {selectionnee && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
              )}

              <Text style={styles.reponseTexte}>{reponse.texte}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {afficherFooter && (
        <View style={styles.footer}>
          {questionIndex > 0 && (
            <TouchableOpacity
              style={styles.precedentButton}
              onPress={() => {
                annulerAutoAvance();
                setQuestionIndex((prev) => prev - 1);
              }}
            >
              <Text style={styles.precedentButtonText}>← Précédent</Text>
            </TouchableOpacity>
          )}

          {afficherBoutonSuivant && (
            <TouchableOpacity
              style={[styles.suivantButton, !peutContinuer && styles.suivantButtonDesactive]}
              onPress={handleSuivant}
              disabled={!peutContinuer}
            >
              <Text style={styles.suivantButtonText}>
                {derniereQuestion ? 'Terminer ✓' : 'Suivant →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator color={Colors.blanc} size="large" />
          <Text style={styles.submittingText}>Envoi en cours...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.creme,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.grisMoyen,
    fontSize: 15,
    textAlign: 'center',
  },
  header: {
    backgroundColor: Colors.creme,
    padding: 16,
    paddingTop: 54,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: Colors.aubergine,
    fontSize: 24,
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  progressLabel: {
    color: Colors.grisMoyen,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.fondGris,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.corail[600],
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  intitule: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 8,
    textAlign: 'center',
  },
  multipleHint: {
    color: Colors.grisMoyen,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  reponseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.fondGris,
  },
  reponseCardSelectionnee: {
    borderColor: Colors.corail[600],
    backgroundColor: Colors.fondRose,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.grisMoyen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelectionne: {
    borderColor: Colors.corail[600],
  },
  radioInterieur: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.corail[600],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.grisMoyen,
    backgroundColor: Colors.blanc,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelectionne: {
    borderColor: Colors.corail[600],
    backgroundColor: Colors.corail[600],
  },
  checkboxCheck: {
    color: Colors.blanc,
    fontSize: 13,
    fontWeight: '700',
  },
  reponseTexte: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: Colors.aubergine,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
  },
  precedentButton: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  precedentButtonText: {
    color: Colors.grisMoyen,
    fontSize: 15,
    fontWeight: '700',
  },
  suivantButton: {
    flex: 1,
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  suivantButtonDesactive: {
    backgroundColor: Colors.grisMoyen,
    opacity: 0.4,
  },
  suivantButtonText: {
    color: Colors.blanc,
    fontSize: 15,
    fontWeight: '700',
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingText: {
    color: Colors.blanc,
    marginTop: 12,
  },
});
