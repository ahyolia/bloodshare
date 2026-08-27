import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { getProfil, Profil } from '../../../services/profil.service';
import { CategorieQuiz, getQuizCategories, QuizItem } from '../../../services/quiz.service';

// 📖 Table de correspondance catégorie → icône + couleur de fond du cercle
// → Pourquoi une table plutôt qu'un switch : plus lisible, et facile à compléter si de nouvelles catégories de quiz apparaissent
const CATEGORIE_STYLE: Record<string, { emoji: string; fond: string }> = {
  'Les bases du don': { emoji: '🩸', fond: Colors.fondRose },
  'Les groupes sanguins': { emoji: '🔬', fond: Colors.fondBleu },
  "L'association ADSB-NC": { emoji: '🏥', fond: Colors.fondVert },
};

const getCategorieStyle = (categorie: string) =>
  CATEGORIE_STYLE[categorie] ?? { emoji: '💡', fond: Colors.fondNeutre };

export default function QuizScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategorieQuiz[] | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 📖 Une catégorie ouverte = sa clé (le nom de catégorie) présente dans le Set
  // → Pourquoi un Set et pas un simple string : plusieurs catégories peuvent être ouvertes en même temps ici
  //   (contrairement à l'onglet Don où un seul panneau à la fois faisait sens) ; un Set permet d'ajouter/retirer
  //   une clé sans impacter les autres déjà ouvertes
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openEnCours, setOpenEnCours] = useState<Set<string>>(new Set());

  const [showModalNiveau, setShowModalNiveau] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 📖 Les deux appels sont indépendants (contenu des quiz vs points de l'utilisateur) : les lancer
    //    en parallèle avec Promise.all divise le temps d'attente par ~2 par rapport à deux await en séquence
    Promise.all([getQuizCategories(), getProfil()])
      .then(([quizData, meData]) => {
        if (cancelled) return;
        setCategories(quizData);
        setProfil(meData);
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
  }, []);

  const toggleCategorie = (categorie: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categorie)) next.delete(categorie);
      else next.add(categorie);
      return next;
    });
  };

  const toggleEnCours = (categorie: string) => {
    setOpenEnCours((prev) => {
      const next = new Set(prev);
      if (next.has(categorie)) next.delete(categorie);
      else next.add(categorie);
      return next;
    });
  };

  // 📖 Un quiz "en cours" a été commencé (nb_tentatives > 0) mais pas terminé (complete === false)
  const categoriesEnCours = useMemo(() => {
    if (!categories) return [];
    return categories
      .map((cat) => ({
        categorie: cat.categorie,
        quiz: cat.quiz.filter((q) => !q.complete && q.nb_tentatives > 0),
      }))
      .filter((cat) => cat.quiz.length > 0);
  }, [categories]);

  // 📖 Moyenne des 5 quiz complétés les plus récents (les derniers de la liste = les plus récents)
  // → Pourquoi les 5 derniers et pas une moyenne globale : reflète le niveau ACTUEL de l'utilisateur,
  //   une moyenne globale se dilue avec le temps et ne bouge presque plus après beaucoup de quiz
  const { moyenne, totalCompletes } = useMemo(() => {
    if (!categories) return { moyenne: null as number | null, totalCompletes: 0 };

    const quizCompletes = categories
      .flatMap((cat) => cat.quiz)
      .filter((q): q is QuizItem & { score: number } => q.complete && q.score !== null);

    const cinqDerniers = quizCompletes.slice(-5);
    const moyenneCalculee =
      cinqDerniers.length > 0
        ? cinqDerniers.reduce((somme, q) => somme + q.score, 0) / cinqDerniers.length
        : null;

    return { moyenne: moyenneCalculee, totalCompletes: quizCompletes.length };
  }, [categories]);

  const initiale = profil?.pseudo ? profil.pseudo.charAt(0).toUpperCase() : '?';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.corail[600]} size="large" />
      </View>
    );
  }

  if (error || !categories || !profil) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Impossible de charger les quiz.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quiz</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.pointsBadge} onPress={() => setShowModalNiveau(true)}>
              <Text style={styles.pointsBadgeText}>{profil.points_cumules} ★</Text>
            </TouchableOpacity>

            <Ionicons name="notifications" size={22} color={Colors.aubergine} />

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initiale}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quiz en cours</Text>

        {categoriesEnCours.length === 0 ? (
          <View style={styles.aVenirCard}>
            <View style={styles.aVenirIconCircle}>
              <Text style={styles.aVenirIcon}>💡</Text>
            </View>
            <View style={styles.aVenirTexte}>
              <Text style={styles.aVenirTitre}>À venir</Text>
              <Text style={styles.aVenirSousTitre}>D'autres quiz arrivent prochainement !</Text>
            </View>
          </View>
        ) : (
          categoriesEnCours.map((cat) => {
            const style = getCategorieStyle(cat.categorie);
            const ouvert = openEnCours.has(cat.categorie);

            return (
              <View key={cat.categorie} style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleEnCours(cat.categorie)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: style.fond }]}>
                    <Text style={styles.iconEmoji}>💡</Text>
                  </View>
                  <View style={styles.accordionCenter}>
                    <Text style={styles.accordionTitre}>{cat.categorie}</Text>
                    <Text style={styles.accordionSousTitre}>{cat.quiz.length} quiz en cours</Text>
                  </View>
                  <Ionicons name={ouvert ? 'chevron-down' : 'chevron-forward'} size={18} color={Colors.grisMoyen} />
                </TouchableOpacity>

                {ouvert &&
                  cat.quiz.map((quiz) => (
                    <View key={quiz.id} style={styles.subCard}>
                      <View style={styles.subCardRow}>
                        <Text style={styles.subCardTitre}>{quiz.titre}</Text>
                        <View style={styles.pointsPill}>
                          <Text style={styles.pointsPillText}>{quiz.points_attribues} ★</Text>
                        </View>
                      </View>

                      <Text style={styles.progressLabel}>
                        {quiz.questions_repondues}/{quiz.nb_questions} questions
                      </Text>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(quiz.questions_repondues / quiz.nb_questions) * 100}%`,
                            },
                          ]}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.reprendreButton}
                        onPress={() =>
                          router.push({ pathname: '/tabs/quiz/[id]', params: { id: quiz.id } })
                        }
                      >
                        <Text style={styles.reprendreButtonText}>Reprendre</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Tous les quiz</Text>

        {categories.map((cat) => {
          const style = getCategorieStyle(cat.categorie);
          const ouvert = openCategories.has(cat.categorie);

          return (
            <View key={cat.categorie} style={styles.accordionCard}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleCategorie(cat.categorie)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: style.fond }]}>
                  <Text style={styles.iconEmoji}>{style.emoji}</Text>
                </View>
                <View style={styles.accordionCenter}>
                  <Text style={styles.accordionTitre}>{cat.categorie}</Text>
                  <Text style={styles.accordionSousTitre}>{cat.quiz.length} quiz</Text>
                </View>
                <Ionicons name={ouvert ? 'chevron-down' : 'chevron-forward'} size={18} color={Colors.grisMoyen} />
              </TouchableOpacity>

              {ouvert &&
                cat.quiz.map((quiz) => (
                  <TouchableOpacity
                    key={quiz.id}
                    style={styles.subCard}
                    onPress={() =>
                      router.push({ pathname: '/tabs/quiz/[id]', params: { id: quiz.id } })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.subCardRow}>
                      <Text style={styles.subCardTitre}>{quiz.titre}</Text>

                      {quiz.complete ? (
                        <View style={styles.completeBadge}>
                          <Text style={styles.completeBadgeText}>✓ Complété</Text>
                        </View>
                      ) : (
                        <View style={styles.pointsPill}>
                          <Text style={styles.pointsPillText}>{quiz.points_attribues} ★</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          );
        })}

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Historique et progression
        </Text>

        <View style={styles.historiqueCard}>
          <Text style={styles.historiqueLabel}>Moyenne</Text>
          <Text style={styles.historiqueScore}>{moyenne !== null ? moyenne.toFixed(1) : '–'}/5</Text>
          <Text style={styles.historiqueSousLabel}>Sur les 5 derniers quiz</Text>

          <View style={styles.separateur} />

          <Text style={styles.historiqueLabel}>Vous avez complété</Text>
          <Text style={styles.historiqueTotal}>{totalCompletes} Quiz au total !</Text>

          <View style={styles.separateur} />

          <Text style={styles.historiqueLabel}>Envie d'en apprendre plus ?</Text>
          <TouchableOpacity
            style={styles.fichesButton}
            onPress={() => router.push({ pathname: '/tabs/don', params: { section: 'fiches' } })}
          >
            <Text style={styles.fichesButtonText}>Lire les fiches pratiques</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showModalNiveau}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModalNiveau(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowModalNiveau(false)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <View style={styles.modalPointsBadge}>
              <Text style={styles.modalPointsBadgeText}>{profil.points_cumules} ★</Text>
            </View>

            <Text style={styles.modalNiveauLabel}>Vous êtes au niveau</Text>
            <Text style={styles.modalNiveauNumero}>{profil.niveau.niveau}</Text>

            <View style={styles.modalSeparateur} />

            <Text style={styles.modalProgressionLabel}>
              {profil.niveau.points_prochain_niveau !== null
                ? `${profil.points_cumules}/${profil.niveau.points_prochain_niveau}`
                : 'Niveau maximum atteint ! 🎉'}
            </Text>

            <View style={styles.modalProgressTrack}>
              <View
                style={[styles.modalProgressFill, { width: `${profil.niveau.progression}%` }]}
              />
            </View>

            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoTitre}>Comment gagner des points ?</Text>
              <Text style={styles.modalInfoItem}>• Faire les quiz</Text>
              <Text style={styles.modalInfoItem}>• Participer au défi du mois</Text>
              <Text style={styles.modalInfoItem}>• Parrainer un ami</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowModalNiveau(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.grisMoyen,
    fontSize: 15,
    textAlign: 'center',
  },
  content: {
    padding: 18,
    paddingTop: 54,
    paddingBottom: 126,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsBadge: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsBadgeText: {
    color: Colors.aubergine,
    fontSize: 13,
    fontWeight: '700',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.petrole[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.blanc,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  aVenirCard: {
    backgroundColor: Colors.fondGris,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  aVenirIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.fondNeutre,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aVenirIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  aVenirTexte: {
    alignItems: 'center',
  },
  aVenirTitre: {
    color: Colors.grisMoyen,
    fontWeight: '700',
    fontSize: 15,
  },
  aVenirSousTitre: {
    color: Colors.grisMoyen,
    fontSize: 12,
    textAlign: 'center',
  },
  accordionCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  accordionCenter: {
    flex: 1,
    marginLeft: 12,
  },
  accordionTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  accordionSousTitre: {
    fontSize: 12,
    color: Colors.grisMoyen,
    marginTop: 2,
  },
  subCard: {
    backgroundColor: Colors.fondGrisClair,
    borderRadius: 8,
    margin: 8,
    marginTop: 0,
    padding: 12,
  },
  subCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subCardTitre: {
    flex: 1,
    fontSize: 14,
    color: Colors.aubergine,
    marginRight: 8,
  },
  pointsPill: {
    backgroundColor: Colors.lime,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsPillText: {
    color: Colors.aubergine,
    fontSize: 11,
    fontWeight: '700',
  },
  completeBadge: {
    backgroundColor: Colors.fondVert,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completeBadgeText: {
    color: Colors.succes,
    fontSize: 11,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.grisMoyen,
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.fondGris,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.corail[600],
  },
  reprendreButton: {
    backgroundColor: Colors.aubergine,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  reprendreButtonText: {
    color: Colors.blanc,
    fontSize: 13,
    fontWeight: '700',
  },
  historiqueCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  historiqueLabel: {
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
  },
  historiqueScore: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  historiqueSousLabel: {
    color: Colors.grisMoyen,
    fontSize: 13,
    textAlign: 'center',
  },
  historiqueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
    marginTop: 4,
  },
  separateur: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.fondGris,
    marginVertical: 12,
  },
  fichesButton: {
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  fichesButtonText: {
    color: Colors.blanc,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    backgroundColor: Colors.blanc,
    alignItems: 'center',
  },
  modalPointsBadge: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  modalPointsBadgeText: {
    fontSize: 14,
    color: Colors.aubergine,
    fontWeight: '700',
  },
  modalNiveauLabel: {
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  modalNiveauNumero: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  modalSeparateur: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.grisMoyen,
    opacity: 0.3,
  },
  modalProgressionLabel: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 12,
  },
  modalProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.fondGris,
    marginVertical: 12,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.corail[600],
  },
  modalInfoCard: {
    width: '100%',
    backgroundColor: Colors.creme,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  modalInfoTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  modalInfoItem: {
    fontSize: 13,
    color: Colors.grisMoyen,
    lineHeight: 24,
  },
  modalCloseButton: {
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: Colors.blanc,
    fontWeight: '700',
  },
});
