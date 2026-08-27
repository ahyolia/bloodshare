import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
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

  const message =
    scoreNum === totalNum
      ? { texte: 'Parfait ! 🎉', couleur: Colors.petrole[500] }
      : scoreNum >= totalNum / 2
        ? { texte: 'Bravo !', couleur: Colors.aubergine }
        : { texte: 'Continuez vos efforts !', couleur: Colors.grisMoyen };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.score}>
          {scoreNum}/{totalNum}
        </Text>

        <Text style={[styles.message, { color: message.couleur }]}>{message.texte}</Text>

        <Text style={styles.sousMessage}>Tu as obtenu</Text>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>{pointsNum} ★</Text>
        </View>

        {!estPremiere && (
          <Text style={styles.dejaCompleteText}>+0 ★ (déjà complété)</Text>
        )}

        <View style={styles.separateur} />

        <Text style={styles.recapLabel}>
          {scoreNum} bonne{scoreNum > 1 ? 's' : ''} réponse{scoreNum > 1 ? 's' : ''} sur {totalNum}
        </Text>

        {/* 📖 Une pastille par question, colorée selon la correction réelle renvoyée par le
            serveur (details). Vert = juste, corail = faux. Sans details : approximation
            sur les `scoreNum` premières. */}
        <View style={styles.pillsRow}>
          {Array.from({ length: totalNum }).map((_, index) => {
            const reussie =
              detailsCorrection.length > 0
                ? Boolean(detailsCorrection[index]?.correcte)
                : index < scoreNum;

            return (
              <View
                key={index}
                style={[styles.pill, reussie ? styles.pillReussie : styles.pillRatee]}
              >
                <Text style={[styles.pillText, reussie ? styles.pillTextReussie : styles.pillTextRatee]}>
                  {reussie ? '✓' : '✕'} {index + 1}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.separateur} />

        {!estPremiere && (
          <Text style={styles.rejoueText}>
            Vous avez déjà complété ce quiz. Les points ont été attribués lors de votre première
            tentative.
          </Text>
        )}

        <Text style={styles.envieText}>Envie d'en apprendre plus ?</Text>

        <TouchableOpacity
          style={styles.fichesButton}
          onPress={() => router.replace({ pathname: '/tabs/don', params: { section: 'fiches' } })}
        >
          <Text style={styles.fichesButtonText}>Lire les fiches pratiques</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejouerButton}
          onPress={() =>
            router.replace({ pathname: '/tabs/quiz/[id]', params: { id: quiz_id } })
          }
        >
          <Text style={styles.rejouerButtonText}>Rejouer ce quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retourButton}
          onPress={() => router.replace('/tabs/quiz')}
        >
          <Text style={styles.retourButtonText}>Retour aux quiz</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  header: {
    padding: 24,
    paddingBottom: 0,
  },
  backButtonText: {
    color: Colors.aubergine,
    fontSize: 24,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 126,
  },
  score: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  sousMessage: {
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsBadge: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pointsBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  dejaCompleteText: {
    color: Colors.grisMoyen,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  separateur: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.fondGris,
    marginVertical: 20,
  },
  recapLabel: {
    color: Colors.aubergine,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
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
    borderRadius: 20,
  },
  pillReussie: {
    backgroundColor: Colors.succes,
  },
  pillRatee: {
    backgroundColor: Colors.fondRose,
  },
  pillText: {
    fontWeight: '700',
    fontSize: 13,
  },
  pillTextReussie: {
    color: Colors.blanc,
  },
  pillTextRatee: {
    color: Colors.corail[600],
  },
  rejoueText: {
    color: Colors.grisMoyen,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  envieText: {
    color: Colors.grisMoyen,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  fichesButton: {
    width: '100%',
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  fichesButtonText: {
    color: Colors.blanc,
    fontSize: 15,
    fontWeight: '700',
  },
  rejouerButton: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  rejouerButtonText: {
    color: Colors.grisMoyen,
    fontSize: 15,
    fontWeight: '700',
  },
  retourButton: {
    marginTop: 8,
    padding: 8,
  },
  retourButtonText: {
    color: Colors.petrole[500],
    fontSize: 14,
    textAlign: 'center',
  },
});
