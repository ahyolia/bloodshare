import { useFocusEffect } from 'expo-router';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IllustrationScore } from '../../../components/quiz/IllustrationScore';
import { Bouton } from '../../../components/ui/Bouton';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useCompteur } from '../../../hooks/useCompteur';
import { Theme } from '../../../constants/colors';
import { Espace, Ombre, Rayon } from '../../../constants/spacing';
import { Police, Typo } from '../../../constants/typography';
import type { Question } from '../../../services/quiz.service';
import { recapDuQuiz } from '../../../stores/quizRecap.store';
import { accorder, compter } from '../../../utils/pluriel';
import { TAB_BAR_STYLE } from '../_layout';

export default function QuizScoreScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  // 📖 L'écran score fait partie du Stack quiz : on garde la tab bar masquée ici aussi
  //    (footer avec boutons fiches / rejouer / retour) et on la restaure au retour vers la liste.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  const {
    quiz_id,
    quiz_titre,
    score,
    total_questions,
    points_gagnes,
    premiere_completion,
    details,
  } = useLocalSearchParams<{
    quiz_id: string;
    quiz_titre: string;
    score: string;
    total_questions: string;
    points_gagnes: string;
    premiere_completion: string;
    details: string;
  }>();

  const scoreNum = Number(score);
  const totalNum = Number(total_questions);
  const pointsNum = Number(points_gagnes);
  const estPremiere = premiere_completion === 'true';

  // 📖 Détail de la correction question par question (sérialisé en param de navigation).
  //    Si absent ou illisible → on retombe sur un affichage approché (les `scoreNum` premières).
  const detailsCorrection: { question_id: number; correcte: boolean }[] = (() => {
    try {
      const parsed = JSON.parse(details ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  // 📖 Récapitulatif complet (intitulés, réponses, explications), dans l'ordre où les
  //    questions ont été jouées. Absent après un rechargement de la page : pastilles seules.
  const recap = recapDuQuiz(Number(quiz_id));
  const questionsCorrigees = (recap?.questions ?? []).flatMap((question) => {
    const detail = recap?.details.find((d) => d.question_id === question.id);
    return detail ? [{ question, detail }] : [];
  });

  const textesReponses = (question: Question, ids: number[]) =>
    question.reponses
      .filter((r) => ids.includes(r.id))
      .map((r) => r.texte)
      .join(', ');

  // Le score monte de 0 à sa valeur, après l'apparition du médaillon.
  const scoreAffiche = useCompteur(scoreNum, 700, 350);

  const message =
    scoreNum === totalNum
      ? {
          titre: 'Parfait !',
          texte: 'Tu connais le don du sang sur le bout des doigts.',
          icone: 'trophy-outline' as const,
        }
      : scoreNum >= totalNum / 2
        ? {
            titre: 'Bravo !',
            texte: 'Encore quelques notions et ce sera parfait.',
            icone: 'ribbon-outline' as const,
          }
        : {
            titre: 'Bien essayé !',
            texte: 'Relis les explications ci-dessous, puis retente ta chance.',
            icone: 'heart-outline' as const,
          };

  return (
    <View style={styles.screen}>
      {/* 📖 Même en-tête que les sous-pages du Profil. Le retour mène à la liste des quiz :
          le quiz terminé a été remplacé par cet écran, il n'y a rien à rouvrir. */}
      <View style={styles.header}>
        <EnTeteSousPage titre={quiz_titre ?? 'Quiz'} onRetour={() => router.replace('/tabs/quiz')} />
      </View>

      {/* 📖 Chorégraphie de fin : le bloc et son médaillon, le titre, le nombre de bonnes
          réponses qui monte, les pastilles une à une, les points, puis le récapitulatif.
          Tout arrive en moins de 1,5 s, et Reanimated saute ces entrées si « Réduire les
          animations » est activé. */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 📖 Hiérarchie du bloc résultat : 1. le nombre de bonnes réponses, en très grand
            et en pétrole (la couleur des bonnes réponses dans l'app) ; 2. le détail par
            question ; 3. les points gagnés ; 4. l'encouragement. */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.resultat}>
          <IllustrationScore icone={message.icone} festif={scoreNum >= totalNum / 2} />

          <Animated.Text
            entering={FadeInDown.delay(250).duration(350)}
            style={[Typo.titre1, styles.message]}
            accessibilityRole="header"
          >
            {message.titre}
          </Animated.Text>

          <Animated.View
            entering={FadeInDown.delay(400).duration(350)}
            style={styles.scoreBloc}
            accessible
            accessibilityLabel={`${compter(scoreNum, 'bonne réponse')} sur ${totalNum}`}
          >
            <Text style={styles.score}>
              <Text style={styles.scoreObtenu}>{scoreAffiche}</Text>
              <Text style={styles.scoreTotal}> / {totalNum}</Text>
            </Text>
            <Text style={[Typo.corpsFort, styles.scoreLibelle]}>
              {accorder(scoreNum, 'bonne réponse')}
            </Text>
          </Animated.View>

          {/* 📖 Une pastille par question, colorée selon la correction réelle renvoyée par le
              serveur (details). Vert = juste, gris = faux (jamais de rouge). Sans details :
              approximation sur les `scoreNum` premières. */}
          <View style={styles.pillsRow}>
          {Array.from({ length: totalNum }).map((_, index) => {
            const reussie =
              questionsCorrigees.length > 0
                ? Boolean(questionsCorrigees[index]?.detail.correcte)
                : detailsCorrection.length > 0
                  ? Boolean(detailsCorrection[index]?.correcte)
                  : index < scoreNum;

            return (
              <Animated.View
                key={index}
                entering={ZoomIn.delay(650 + index * 70).springify().damping(12)}
                style={[styles.pill, reussie ? styles.pillReussie : styles.pillRatee]}
              >
                <Text style={[styles.pillText, reussie ? styles.pillTextReussie : styles.pillTextRatee]}>
                  {reussie ? '✓' : '✕'} {index + 1}
                </Text>
              </Animated.View>
            );
          })}
          </View>

          {/* Séparation en pointillés, comme un ticket : en dessous, ce que le quiz rapporte. */}
          <View style={styles.separateurTicket} />

          <Animated.View
            entering={ZoomIn.delay(1000).springify().damping(10)}
            style={styles.pointsBadge}
          >
            <Ionicons name="star" size={16} color={Theme.accent.signatureTexte} />
            <Text style={[Typo.corpsFort, styles.pointsBadgeText]}>
              {estPremiere ? `+${compter(pointsNum, 'point')}` : '+0 point (déjà terminé)'}
            </Text>
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(1100).duration(300)}
            style={[Typo.corps, styles.sousMessage]}
          >
            {message.texte}
          </Animated.Text>
        </Animated.View>

        {questionsCorrigees.length > 0 && (
          <View style={styles.recap}>
            <Text style={styles.recapTitre}>Récapitulatif</Text>

            {questionsCorrigees.map(({ question, detail }, index) => (
              <Animated.View
                key={question.id}
                // Rang plafonné : la 10e carte n'attend pas 1 s de plus que la première.
                entering={FadeInDown.delay(1100 + Math.min(index, 5) * 60).duration(300)}
                style={styles.recapCard}
              >
                {/* 📖 Trois niveaux de lecture : la question, puis les réponses (bonne réponse
                    mise en avant), puis l'explication en retrait. La fiche reste une action
                    secondaire, en fin de carte. */}
                <Text style={[Typo.legendeForte, styles.recapNumero]}>
                  Question {index + 1}
                </Text>
                <Text style={styles.recapIntitule}>{question.intitule}</Text>

                <View style={styles.recapReponses}>
                  <View
                    style={[
                      styles.recapReponse,
                      detail.correcte ? styles.recapReponseBonne : styles.recapReponseFausse,
                    ]}
                  >
                    <Ionicons
                      name={detail.correcte ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={detail.correcte ? Theme.feedback.succesTexte : Theme.texte.secondaire}
                    />
                    <View style={styles.recapReponseTextes}>
                      <Text style={[Typo.legende, styles.recapLibelle]}>Ta réponse</Text>
                      <Text
                        style={[
                          Typo.legendeForte,
                          detail.correcte ? styles.recapTexteBon : styles.recapTexteFaux,
                        ]}
                      >
                        {textesReponses(question, detail.reponse_ids) || '—'}
                      </Text>
                    </View>
                  </View>

                  {!detail.correcte && (
                    <View style={[styles.recapReponse, styles.recapReponseBonne]}>
                      <Ionicons name="checkmark-circle" size={18} color={Theme.feedback.succesTexte} />
                      <View style={styles.recapReponseTextes}>
                        <Text style={[Typo.legende, styles.recapLibelle]}>Bonne réponse</Text>
                        <Text style={[Typo.legendeForte, styles.recapTexteBon]}>
                          {textesReponses(question, detail.reponses_correctes)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {!!detail.explication && (
                  <Text style={[Typo.legende, styles.recapExplication]}>{detail.explication}</Text>
                )}

                {detail.contenu && (
                  <TouchableOpacity
                    style={styles.recapFiche}
                    activeOpacity={0.6}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Lire la fiche : ${detail.contenu.titre}`}
                    onPress={() =>
                      router.push({
                        pathname: '/tabs/quiz/fiche/[id]',
                        params: { id: String(detail.contenu!.id) },
                      })
                    }
                  >
                    <Ionicons name="document-text-outline" size={16} color={Theme.info.icone} />
                    <Text style={[Typo.legendeForte, styles.recapFicheTexte]}>
                      Lire la fiche
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={Theme.info.icone} />
                  </TouchableOpacity>
                )}
              </Animated.View>
            ))}
          </View>
        )}

        {!estPremiere && (
          <Text style={[Typo.legende, styles.rejoueText]}>
            Tu avais déjà terminé ce quiz : les points ont été attribués lors de ta première
            tentative.
          </Text>
        )}

        {/* 📖 Fiches en `info` (pétrole plein, comme sur la liste des quiz), rejouer en
            `secondaire` : le bouton principal reste « Retour aux quiz », en bas. */}
        <View style={styles.actionsSecondaires}>
          <Bouton
            libelle="Lire les fiches pratiques"
            icone="document-text-outline"
            variante="info"
            onPress={() => router.replace({ pathname: '/tabs/don', params: { section: 'fiches' } })}
          />
          <Bouton
            libelle="Rejouer ce quiz"
            icone="refresh"
            variante="secondaire"
            onPress={() => router.replace({ pathname: '/tabs/quiz/[id]', params: { id: quiz_id } })}
          />
        </View>
      </ScrollView>

      {/* 📖 Action principale toujours visible en bas, même pendant la lecture du récapitulatif. */}
      <Animated.View entering={FadeInDown.delay(1000).duration(300)} style={styles.footer}>
        <Bouton libelle="Retour aux quiz" onPress={() => router.replace('/tabs/quiz')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 54,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: Espace[8],
  },
  // 📖 Bloc résultat blanc et surélevé, comme le bloc de la question : tout ce qui
  //    concerne le résultat est regroupé, le récapitulatif vient après.
  resultat: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Espace[3],
    paddingHorizontal: 20,
    paddingVertical: Espace[6],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  scoreBloc: {
    alignItems: 'center',
  },
  score: {
    fontFamily: Police.corpsGras,
    color: Theme.feedback.succesTexte,
  },
  // 📖 L'information principale de l'écran : en très grand, en pétrole.
  scoreObtenu: {
    fontSize: 64,
    lineHeight: 72,
  },
  scoreTotal: {
    fontSize: 28,
    color: Theme.texte.secondaire,
  },
  scoreLibelle: {
    color: Theme.texte.principal,
  },
  message: {
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  separateurTicket: {
    alignSelf: 'stretch',
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: Theme.fond.bordure,
    marginVertical: Espace[2],
  },
  sousMessage: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
    backgroundColor: Theme.accent.signatureAplat,
    borderRadius: Rayon.plein,
    paddingHorizontal: Espace[4],
    paddingVertical: Espace[2],
  },
  pointsBadgeText: {
    color: Theme.accent.signatureTexte,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Rayon.plein,
  },
  pillReussie: {
    backgroundColor: Theme.feedback.succesSurface,
  },
  pillRatee: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  pillText: {
    fontWeight: '700',
    fontSize: 13,
  },
  pillTextReussie: {
    color: Theme.feedback.succesTexte,
  },
  pillTextRatee: {
    color: Theme.texte.secondaire,
  },
  recap: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  recapTitre: {
    color: Theme.texte.principal,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  recapCard: {
    backgroundColor: Theme.fond.surface,
    borderRadius: Rayon.md,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
    padding: 16,
  },
  recapNumero: {
    color: Theme.texte.secondaire,
  },
  recapIntitule: {
    ...Typo.corpsFort,
    color: Theme.texte.principal,
    marginTop: 2,
  },
  recapReponses: {
    gap: 6,
    marginTop: 12,
  },
  recapReponse: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Rayon.sm,
  },
  recapReponseBonne: {
    backgroundColor: Theme.feedback.succesSurface,
  },
  recapReponseFausse: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  recapReponseTextes: {
    flex: 1,
  },
  recapLibelle: {
    color: Theme.texte.secondaire,
    fontSize: 12,
    lineHeight: 16,
  },
  recapTexteBon: {
    color: Theme.feedback.succesTexte,
  },
  recapTexteFaux: {
    color: Theme.texte.principal,
  },
  recapExplication: {
    color: Theme.texte.secondaire,
    marginTop: 12,
  },
  recapFiche: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
  },
  recapFicheTexte: {
    color: Theme.info.icone,
  },
  rejoueText: {
    color: Theme.texte.secondaire,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Espace[6],
  },
  actionsSecondaires: {
    alignSelf: 'stretch',
    gap: Espace[3],
    marginTop: Espace[6],
  },
  footer: {
    padding: Espace[4],
    paddingBottom: Espace[6],
    backgroundColor: Theme.fond.page,
    borderTopWidth: 1,
    borderTopColor: Theme.fond.bordure,
  },
});
