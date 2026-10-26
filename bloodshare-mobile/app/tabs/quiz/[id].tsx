import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useNavigation, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
} from "react-native-reanimated";
import { Theme } from "../../../constants/colors";
import { Espace, Ombre, Rayon } from "../../../constants/spacing";
import { Typo } from "../../../constants/typography";
import { BarreQuestions } from "../../../components/quiz/BarreQuestions";
import { decouperIntitule } from "../../../utils/intituleQuestion";
import { Bouton } from "../../../components/ui/Bouton";
import { EnTeteSousPage } from "../../../components/ui/EnTeteSousPage";
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
  // 📖 Sens du dernier changement de question : la suivante entre par la droite, la
  //    précédente par la gauche, comme on tourne des pages.
  const [sens, setSens] = useState<"avant" | "arriere">("avant");
  const scrollRef = useRef<ScrollView>(null);


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
      // 📖 L'explication arrive sous les réponses : on la fait venir à l'écran en douceur
      //    (le délai laisse le temps au panneau d'être mis en page).
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
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
      setSens("avant");
      setQuestionIndex((prev) => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
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
        <ActivityIndicator color={Theme.marque.principal} size="large" />
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
  const intitule = decouperIntitule(question.intitule);

  return (
    <View style={styles.screen}>
      {/* 📖 Même en-tête que les sous-pages du Profil (bouton retour rond et flottant,
          titre). Le retour passe par `beforeRemove` : la modale d'abandon s'affiche. */}
      <View style={styles.header}>
        <EnTeteSousPage titre={quiz.titre} />
        <BarreQuestions numero={questionIndex + 1} total={quiz.questions.length} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 📖 Une clé par question : en changeant de question, le bloc entre en glissant
            depuis la droite (Suivant) ou la gauche (Précédent), puis les réponses
            arrivent une à une. Reanimated saute ces entrées si « Réduire les
            animations » est activé. */}
        <Animated.View
          key={question.id}
          entering={(sens === "arriere" ? FadeInLeft : FadeInRight).duration(280)}
          style={styles.questionEtReponses}
        >
          {/* 📖 Question et réponses dans un même bloc blanc surélevé : on voit d'un coup
              d'œil ce qui va ensemble. Pas de fond teinté : le corail et les couleurs
              vives restent réservés à ce qui demande l'attention. */}
          <View style={styles.questionBloc}>
            <Text style={[Typo.legendeForte, styles.consigne]}>
              Question {questionIndex + 1} sur {quiz.questions.length}
            </Text>
            {/* 📖 Une question avec une mise en situation se lit en deux temps : le
                contexte en texte courant, puis la question elle-même en titre. */}
            {intitule.contexte && (
              <Text style={[Typo.corps, styles.contexte]}>{intitule.contexte}</Text>
            )}
            <Text style={[Typo.titre3, styles.intitule]} accessibilityRole="header">
              {intitule.question}
            </Text>
            <Text style={[Typo.legende, styles.consigne]}>
              {question.type === "multiple"
                ? "Plusieurs réponses possibles"
                : "Une seule réponse possible"}
            </Text>
          </View>

          {question.reponses.map((reponse, index) => {
            const selectionnee = reponsesSelectionnees.includes(reponse.id);
            const etat = etatReponse(
              reponse.id,
              reponsesSelectionnees,
              correction,
            );

            return (
              <Animated.View
                key={reponse.id}
                entering={FadeInDown.delay(120 + index * 60).duration(260)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.reponseCard,
                    STYLE_CARTE[etat],
                    pressed && styles.reponsePressee,
                  ]}
                  onPress={() => toggleReponse(question, reponse.id)}
                  disabled={!!correction}
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
                    <Animated.View entering={ZoomIn.springify().damping(10)}>
                      <Ionicons
                        name={etat === "correcte" ? "checkmark-circle" : "close-circle"}
                        size={22}
                        color={
                          etat === "correcte"
                            ? Theme.feedback.succesTexte
                            : Theme.texte.secondaire
                        }
                      />
                    </Animated.View>
                  ) : (
                    // 📖 Pastille a, b, c, d : on peut dire « la réponse b », et elle se
                    //    remplit (avec un petit rebond) quand la réponse est choisie.
                    <Animated.View
                      key={selectionnee ? "choisie" : "libre"}
                      entering={selectionnee ? ZoomIn.springify().damping(9) : undefined}
                      style={[
                        styles.lettre,
                        selectionnee && styles.lettreSelectionnee,
                      ]}
                    >
                      <Text
                        style={[
                          Typo.legendeForte,
                          styles.lettreTexte,
                          selectionnee && styles.lettreTexteSelectionnee,
                        ]}
                      >
                        {String.fromCharCode(97 + index)}
                      </Text>
                    </Animated.View>
                  )}

                  <Text style={[Typo.corps, styles.reponseTexte]}>
                    {reponse.texte}
                  </Text>

                  {correction && selectionnee && (
                    <Animated.Text entering={FadeIn.duration(200)} style={styles.taReponse}>
                      Ta réponse
                    </Animated.Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* 📖 Explication : vert si la réponse est juste, pétrole pâle (la couleur des
            informations) sinon. Une réponse fausse n'est pas une alerte : on apprend. */}
        {correction && (
          <Animated.View
            key={`explication-${question.id}`}
            entering={FadeInDown.springify().damping(16)}
            style={[
              styles.explicationCard,
              correction.correcte
                ? styles.explicationCardCorrecte
                : styles.explicationCardInfo,
            ]}
          >
            <View style={styles.explicationEntete}>
              <Ionicons
                name={
                  correction.correcte
                    ? "checkmark-circle"
                    : "information-circle"
                }
                size={22}
                color={
                  correction.correcte
                    ? Theme.feedback.succesTexte
                    : Theme.info.icone
                }
              />
              <Text
                style={[
                  Typo.corpsFort,
                  styles.explicationTitre,
                  correction.correcte && styles.explicationTitreCorrecte,
                ]}
              >
                {correction.correcte ? "Bonne réponse !" : "Pas tout à fait…"}
              </Text>
            </View>

            {!!correction.explication && (
              <Text style={[Typo.corps, styles.explicationTexte]}>
                {correction.explication}
              </Text>
            )}

            {correction.contenu && (
              <Bouton
                libelle="Lire la fiche pratique"
                icone="document-text-outline"
                // Plein pétrole : bien lisible sur le fond vert ou pétrole pâle (6,2:1).
                variante="info"
                accessibilityHint={`Ouvre la fiche « ${correction.contenu.titre} »`}
                onPress={() => ouvrirFiche(correction.contenu!.id)}
              />
            )}
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {questionIndex > 0 && (
          <Bouton
            libelle="Précédent"
            icone="arrow-back"
            variante="secondaire"
            onPress={() => {
              setSens("arriere");
              setQuestionIndex((prev) => prev - 1);
            }}
            style={styles.precedentButton}
          />
        )}

        {/* 📖 Deux temps par question : « Valider » fige la réponse et montre la
            correction, puis « Suivant » (ou « Voir mon score ») enchaîne. */}
        {correction ? (
          <Bouton
            libelle={derniereQuestion ? "Voir mon score" : "Suivant"}
            onPress={handleSuivant}
            style={styles.suivantButton}
          />
        ) : (
          <Bouton
            libelle="Valider"
            onPress={() => handleValider(question)}
            desactive={reponsesSelectionnees.length === 0}
            chargement={verification}
            style={styles.suivantButton}
          />
        )}
      </View>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator color={Theme.texte.surAccent} size="large" />
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

            <Text style={styles.modalTitre}>Quitter le quiz ?</Text>
            <Text style={styles.modalTexte}>
              {"Pas d'inquiétude, tes réponses validées sont sauvegardées. Tu pourras reprendre ce quiz plus tard depuis « Quiz en cours »."}
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
    backgroundColor: Theme.fond.page,
  },
  centered: {
    flex: 1,
    backgroundColor: Theme.fond.page,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: Theme.texte.secondaire,
    fontSize: 15,
    textAlign: "center",
  },
  // Mêmes marges que les sous-pages du Profil (18 px sur les côtés, 54 px en haut).
  header: {
    backgroundColor: Theme.fond.page,
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[2],
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: Espace[4],
    paddingBottom: Espace[8],
    gap: Espace[3],
  },
  // 📖 Le bloc de la question, blanc et surélevé : il contient les réponses à toucher.
  questionEtReponses: {
    gap: Espace[3],
    paddingHorizontal: 20,
    paddingVertical: Espace[8],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  questionBloc: {
    gap: Espace[2],
    marginBottom: Espace[3],
  },
  contexte: {
    color: Theme.texte.principal,
  },
  // La carte s'enfonce légèrement sous le doigt : on sent qu'on l'a touchée.
  reponsePressee: {
    transform: [{ scale: 0.98 }],
  },
  intitule: {
    color: Theme.texte.principal,
  },
  consigne: {
    color: Theme.texte.secondaire,
  },
  reponseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espace[3],
    minHeight: 56,
    // Crème sur le bloc blanc : chaque réponse se détache sans ombre de plus.
    backgroundColor: Theme.fond.page,
    borderRadius: Rayon.md,
    paddingVertical: Espace[3],
    paddingHorizontal: Espace[4],
    borderWidth: 2,
    borderColor: Theme.fond.bordure,
  },
  lettre: {
    width: 28,
    height: 28,
    borderRadius: Rayon.plein,
    // Blanche sur la réponse crème : la lettre reste bien visible.
    backgroundColor: Theme.fond.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  lettreSelectionnee: {
    backgroundColor: Theme.action.primaire,
  },
  lettreTexte: {
    color: Theme.texte.principal,
  },
  lettreTexteSelectionnee: {
    color: Theme.action.primaireTexte,
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
    marginTop: Espace[3],
    padding: Espace[4],
    gap: Espace[3],
    borderRadius: Rayon.lg,
  },
  explicationCardCorrecte: {
    backgroundColor: Theme.feedback.succesSurface,
  },
  explicationCardInfo: {
    backgroundColor: Theme.info.fond,
  },
  explicationEntete: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espace[2],
  },
  explicationTitre: {
    color: Theme.texte.principal,
  },
  explicationTitreCorrecte: {
    color: Theme.feedback.succesTexte,
  },
  explicationTexte: {
    color: Theme.texte.principal,
  },
  reponseTexte: {
    flex: 1,
    color: Theme.texte.principal,
  },
  footer: {
    flexDirection: "row",
    gap: Espace[3],
    padding: Espace[4],
    paddingBottom: Espace[6],
  },
  precedentButton: {
    flex: 1,
  },
  // 📖 Le bouton principal prend toute la place qui reste : pleine largeur à la 1re question.
  suivantButton: {
    flex: 2,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  submittingText: {
    color: Theme.texte.surAccent,
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
    backgroundColor: Theme.fond.surface,
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
    backgroundColor: Theme.marque.doux,
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
    color: Theme.texte.principal,
    textAlign: "center",
  },
  modalTexte: {
    fontSize: 14,
    color: Theme.texte.secondaire,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  modalBoutonPrincipal: {
    width: "100%",
    backgroundColor: Theme.action.primaire,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBoutonPrincipalTexte: {
    color: Theme.action.primaireTexte,
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
    color: Theme.action.discreteTexte,
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
