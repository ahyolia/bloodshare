import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useNavigation, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Theme } from "../../../constants/colors";
import { TAB_BAR_STYLE } from "../_layout";
import {
  Correction,
  getQuizDetail,
  Question,
  QuizDetail,
  ReponsePayload,
  submitQuiz,
  verifierQuestion,
} from "../../../services/quiz.service";
import { useDialogue } from "../../../components/DialogueProvider";
import { memoriserRecapQuiz } from "../../../stores/quizRecap.store";
import { EtatReponse, etatReponse } from "../../../utils/quizCorrection";

export default function QuizDeroulementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { informer } = useDialogue();

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

  // 📖 Map<question_id, correction> des questions déjà validées. Une question présente ici
  //    est verrouillée : on affiche sa correction et on ne peut plus changer sa réponse.
  const [corrections, setCorrections] = useState<Map<number, Correction>>(
    new Map(),
  );
  const [verification, setVerification] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // 📖 Drapeau synchrone : passé à true AVANT le router.replace vers l'écran score. Le listener
  //    `beforeRemove` le lit tout de suite, alors que le state `submitting` ne serait committé
  //    qu'au rendu suivant → sans ce ref, quitter [id] pour aller vers /score déclenchait la
  //    modale « Abandonner le quiz ? » au lieu de laisser passer la navigation.
  const soumissionEnCours = useRef(false);

  // 📖 Idem pour l'abandon confirmé : une fois que l'utilisateur a dit « Abandonner », on
  //    laisse passer le `navigation.dispatch` sans réafficher la modale (sinon 2 confirmations).
  const sortieConfirmee = useRef(false);

  // 📖 Modale d'abandon custom (au lieu de Alert natif) : on met en attente l'action de sortie
  //    interceptée, la modale décide de la rejouer ou non.
  const [modaleAbandon, setModaleAbandon] = useState(false);
  const actionSortie = useRef<unknown>(null);

  // 📖 Pendant le déroulement du quiz, on masque la tab bar flottante : sinon elle recouvre
  //    le footer (boutons Précédent / Valider / Suivant). On la restaure en quittant l'écran.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });

      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation]),
  );

  useEffect(() => {
    let cancelled = false;

    getQuizDetail(Number(id))
      .then((data) => {
        if (cancelled) return;
        setQuiz(data);

        // 📖 Reprise d'un quiz commencé : on restaure les réponses déjà validées avec leur
        //    correction, et on repart de la première question non validée (l'ordre peut
        //    changer si le quiz est aléatoire, d'où la recherche par id et non par position).
        const donnees = data.reponses_donnees ?? [];
        if (donnees.length > 0) {
          setReponses(
            new Map(donnees.map((r) => [r.question_id, r.reponse_ids])),
          );
          setCorrections(
            new Map(
              donnees.flatMap((r) =>
                r.correction ? [[r.question_id, r.correction] as const] : [],
              ),
            ),
          );

          const premiereSansReponse = data.questions.findIndex(
            (q) => !donnees.some((r) => r.question_id === q.id),
          );
          setQuestionIndex(
            premiereSansReponse === -1
              ? data.questions.length - 1
              : premiereSansReponse,
          );
        }
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
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      // Soumission en cours ou abandon déjà confirmé → on laisse la navigation se faire
      if (soumissionEnCours.current || sortieConfirmee.current) return;

      e.preventDefault();
      actionSortie.current = e.data.action;
      setModaleAbandon(true);
    });

    return unsubscribe;
  }, [navigation]);

  // 📖 Pas de sauvegarde à la sortie : chaque question validée est déjà enregistrée côté
  //    serveur par verifierQuestion, et une sélection non validée n'a pas à être gardée.
  const confirmerAbandon = () => {
    sortieConfirmee.current = true;
    setModaleAbandon(false);
    if (actionSortie.current)
      navigation.dispatch(actionSortie.current as never);
  };

  const annulerAbandon = () => {
    actionSortie.current = null;
    setModaleAbandon(false);
  };

  const toggleReponse = (question: Question, reponseId: number) => {
    // 📖 Question validée → réponse verrouillée. Pendant la vérification aussi, pour que la
    //    réponse affichée reste celle qui a été envoyée.
    if (corrections.has(question.id) || verification) return;

    setReponses((prev) => {
      const next = new Map(prev);

      if (question.type === "unique") {
        next.set(question.id, [reponseId]);
        return next;
      }

      const actuelles = next.get(question.id) ?? [];
      const dejaSelectionnee = actuelles.includes(reponseId);
      next.set(
        question.id,
        dejaSelectionnee
          ? actuelles.filter((id) => id !== reponseId)
          : [...actuelles, reponseId],
      );
      return next;
    });
  };

  // 📖 Plus d'auto-avance au tap (retour des tests utilisateurs : on doit pouvoir hésiter).
  //    C'est « Valider » qui fige la réponse et affiche la correction ; « Suivant » vient après.
  const handleValider = async (question: Question) => {
    if (!quiz || verification) return;

    const selection = reponses.get(question.id) ?? [];
    if (selection.length === 0) return;

    setVerification(true);
    try {
      const resultat = await verifierQuestion(quiz.id, question.id, selection);
      const { question_id, reponse_ids, ...correction } = resultat;

      // 📖 On affiche les réponses retenues par le serveur : si la question avait déjà été
      //    validée ailleurs (autre appareil), c'est cette première réponse qui compte.
      setReponses((prev) => new Map(prev).set(question_id, reponse_ids));
      setCorrections((prev) => new Map(prev).set(question_id, correction));
    } catch {
      await informer(
        "Erreur",
        "Impossible de vérifier ta réponse. Vérifie ta connexion.",
      );
    } finally {
      setVerification(false);
    }
  };

  const ouvrirFiche = (ficheId: number) => {
    router.push({
      pathname: "/tabs/quiz/fiche/[id]",
      params: { id: String(ficheId) },
    });
  };

  const handleSuivant = () => {
    if (!quiz) return;

    if (questionIndex < quiz.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      handleSoumettre();
    }
  };

  const handleSoumettre = async () => {
    if (!quiz) return;

    soumissionEnCours.current = true;
    setSubmitting(true);

    try {
      // 📖 Notre Map interne (accès rapide par question_id) n'a pas de forme JSON native :
      //    on la convertit ici vers le tableau attendu par l'API au moment de l'envoi
      const reponsesPayload: ReponsePayload[] = Array.from(
        reponses.entries(),
      ).map(([question_id, reponse_ids]) => ({ question_id, reponse_ids }));

      const resultat = await submitQuiz(quiz.id, reponsesPayload);
      memoriserRecapQuiz(quiz.id, {
        questions: quiz.questions,
        details: resultat.details ?? [],
      });

      // 📖 replace : on ne veut pas qu'un retour arrière depuis l'écran score ramène sur le
      //    quiz déjà soumis (même logique que resultat-scan → cartes/accueil)
      router.replace({
        pathname: "/tabs/quiz/score",
        params: {
          quiz_id: String(quiz.id),
          quiz_titre: quiz.titre,
          score: String(resultat.score),
          total_questions: String(resultat.total_questions),
          points_gagnes: String(resultat.points_gagnes),
          premiere_completion: String(resultat.premiere_completion),
          // 📖 Les params de navigation sont des chaînes : on sérialise le juste/faux de
          //    chaque question pour les pastilles. Le détail complet (explications) passe
          //    par memoriserRecapQuiz, trop long pour une URL.
          details: JSON.stringify(
            (resultat.details ?? []).map(({ question_id, correcte }) => ({
              question_id,
              correcte,
            })),
          ),
        },
      });
    } catch {
      // 📖 Échec de l'envoi : on reste sur le quiz, donc on réarme la confirmation d'abandon.
      //    On retire l'overlay « Envoi en cours… » AVANT d'afficher l'erreur, sinon il
      //    resterait visible derrière la modale. Pas de `finally` : en cas de succès,
      //    router.replace quitte l'écran, il n'y a rien à réinitialiser.
      soumissionEnCours.current = false;
      setSubmitting(false);
      await informer(
        "Erreur",
        "Impossible de soumettre le quiz. Vérifie ta connexion.",
      );
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
  const correction = corrections.get(question.id);
  const peutValider = reponsesSelectionnees.length > 0 && !verification;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
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
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intitule}>{question.intitule}</Text>

        {question.type === "multiple" && (
          <Text style={styles.multipleHint}>
            (Plusieurs réponses possibles)
          </Text>
        )}

        {question.reponses.map((reponse) => {
          const selectionnee = reponsesSelectionnees.includes(reponse.id);
          const etat = etatReponse(
            reponse.id,
            reponsesSelectionnees,
            correction,
          );

          return (
            <TouchableOpacity
              key={reponse.id}
              style={[styles.reponseCard, STYLE_CARTE[etat]]}
              onPress={() => toggleReponse(question, reponse.id)}
              disabled={!!correction}
              activeOpacity={0.85}
              accessibilityRole={
                question.type === "unique" ? "radio" : "checkbox"
              }
              accessibilityState={{
                checked: selectionnee,
                disabled: !!correction,
              }}
            >
              {etat === "correcte" || etat === "erreur" ? (
                // 📖 Après validation, une icône dit juste/faux : la couleur seule ne suffit
                //    pas (daltonisme), et le faux n'est volontairement pas en rouge.
                <Ionicons
                  name={etat === "correcte" ? "checkmark-circle" : "close-circle"}
                  size={22}
                  color={
                    etat === "correcte"
                      ? Theme.feedback.succesTexte
                      : Theme.texte.secondaire
                  }
                />
              ) : question.type === "unique" ? (
                <View
                  style={[
                    styles.radio,
                    selectionnee && styles.radioSelectionne,
                  ]}
                >
                  {selectionnee && <View style={styles.radioInterieur} />}
                </View>
              ) : (
                <View
                  style={[
                    styles.checkbox,
                    selectionnee && styles.checkboxSelectionne,
                  ]}
                >
                  {selectionnee && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
              )}

              <Text style={styles.reponseTexte}>{reponse.texte}</Text>

              {correction && selectionnee && (
                <Text style={styles.taReponse}>Ta réponse</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {correction && (
          <View
            style={[
              styles.explicationCard,
              correction.correcte && styles.explicationCardCorrecte,
            ]}
          >
            <Text
              style={[
                styles.explicationTitre,
                correction.correcte && styles.explicationTitreCorrecte,
              ]}
            >
              {correction.correcte ? "Bonne réponse !" : "Pas tout à fait…"}
            </Text>

            {!!correction.explication && (
              <Text style={styles.explicationTexte}>
                {correction.explication}
              </Text>
            )}

            {correction.contenu && (
              <TouchableOpacity
                style={styles.ficheButton}
                onPress={() => ouvrirFiche(correction.contenu!.id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Theme.action.secondaireTexte}
                />
                <Text style={styles.ficheButtonText} numberOfLines={2}>
                  Voir la fiche : {correction.contenu.titre}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {questionIndex > 0 && (
          <TouchableOpacity
            style={styles.precedentButton}
            onPress={() => setQuestionIndex((prev) => prev - 1)}
          >
            <Text style={styles.precedentButtonText}>← Précédent</Text>
          </TouchableOpacity>
        )}

        {/* 📖 Deux temps par question : « Valider » fige la réponse et montre la
            correction, puis « Suivant » (ou « Voir mon score ») enchaîne. */}
        {correction ? (
          <TouchableOpacity style={styles.suivantButton} onPress={handleSuivant}>
            <Text style={styles.suivantButtonText}>
              {derniereQuestion ? "Voir mon score" : "Suivant →"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.suivantButton,
              !peutValider && styles.suivantButtonDesactive,
            ]}
            onPress={() => handleValider(question)}
            disabled={!peutValider}
          >
            {verification ? (
              <ActivityIndicator color={Colors.blanc} />
            ) : (
              <Text style={styles.suivantButtonText}>Valider</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator color={Colors.blanc} size="large" />
          <Text style={styles.submittingText}>Envoi en cours...</Text>
        </View>
      )}

      <Modal
        visible={modaleAbandon}
        transparent
        animationType="fade"
        onRequestClose={annulerAbandon}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCercle}>
              <Text style={styles.modalIcon}>🩸</Text>
            </View>

            <Text style={styles.modalTitre}>Quitter le quiz ?</Text>
            <Text style={styles.modalTexte}>
              {"Pas d'inquiétude, tes réponses validées sont sauvegardées. Tu pourras reprendre ce quiz plus tard depuis « Quiz en cours »."}
            </Text>

            <TouchableOpacity
              style={styles.modalBoutonPrincipal}
              onPress={annulerAbandon}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBoutonPrincipalTexte}>
                Continuer le quiz
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalBoutonSecondaire}
              onPress={confirmerAbandon}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBoutonSecondaireTexte}>Quitter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: Colors.grisMoyen,
    fontSize: 15,
    textAlign: "center",
  },
  header: {
    backgroundColor: Colors.creme,
    padding: 16,
    paddingTop: 54,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
    color: Colors.aubergine,
    textAlign: "center",
  },
  progressLabel: {
    color: Colors.grisMoyen,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.fondGris,
    overflow: "hidden",
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
    fontWeight: "700",
    color: Colors.aubergine,
    marginBottom: 8,
    textAlign: "center",
  },
  multipleHint: {
    color: Colors.grisMoyen,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
  },
  reponseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.fondGris,
  },
  // 📖 Sélection en aubergine (couleur de l'action principale) et plus en corail : avant
  //    validation, une réponse cochée en rouge se lisait déjà comme une erreur.
  reponseCardSelectionnee: {
    borderColor: Theme.action.primaire,
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  reponseCardCorrecte: {
    borderColor: Theme.etat.bon.jauge,
    backgroundColor: Theme.feedback.succesSurface,
  },
  reponseCardErreur: {
    borderColor: Theme.texte.secondaire,
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  reponseCardAttenuee: {
    opacity: 0.55,
  },
  taReponse: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: Theme.texte.secondaire,
  },
  explicationCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  explicationCardCorrecte: {
    backgroundColor: Theme.feedback.succesSurface,
    borderColor: Theme.etat.bon.jauge,
  },
  explicationTitre: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.texte.principal,
  },
  explicationTitreCorrecte: {
    color: Theme.feedback.succesTexte,
  },
  explicationTexte: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: Theme.texte.principal,
  },
  ficheButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Theme.action.secondaireBordure,
    alignSelf: "flex-start",
  },
  ficheButtonText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Theme.action.secondaireTexte,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.grisMoyen,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelectionne: {
    borderColor: Theme.action.primaire,
  },
  radioInterieur: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.action.primaire,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.grisMoyen,
    backgroundColor: Colors.blanc,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelectionne: {
    borderColor: Theme.action.primaire,
    backgroundColor: Theme.action.primaire,
  },
  checkboxCheck: {
    color: Colors.blanc,
    fontSize: 13,
    fontWeight: "700",
  },
  reponseTexte: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: Colors.aubergine,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
  },
  precedentButton: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  precedentButtonText: {
    color: Colors.grisMoyen,
    fontSize: 15,
    fontWeight: "700",
  },
  suivantButton: {
    flex: 1,
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  suivantButtonDesactive: {
    backgroundColor: Colors.grisMoyen,
    opacity: 0.4,
  },
  suivantButtonText: {
    color: Colors.blanc,
    fontSize: 15,
    fontWeight: "700",
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  submittingText: {
    color: Colors.blanc,
    marginTop: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    backgroundColor: Colors.blanc,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalIconCercle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fondRose,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 26,
  },
  modalTitre: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.aubergine,
    textAlign: "center",
  },
  modalTexte: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  modalBoutonPrincipal: {
    width: "100%",
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBoutonPrincipalTexte: {
    color: Colors.blanc,
    fontSize: 15,
    fontWeight: "700",
  },
  modalBoutonSecondaire: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  modalBoutonSecondaireTexte: {
    color: Colors.corail[600],
    fontSize: 14,
    fontWeight: "700",
  },
});

const STYLE_CARTE: Record<EtatReponse, object | undefined> = {
  neutre: undefined,
  selectionnee: styles.reponseCardSelectionnee,
  correcte: styles.reponseCardCorrecte,
  erreur: styles.reponseCardErreur,
  attenuee: styles.reponseCardAttenuee,
};
