import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Banniere, getBanniere, TypeBanniere } from '../../services/bannieres.service';
import { DefiActuel, getDefiActuel } from '../../services/defis.service';
import { getProfil, Profil } from '../../services/profil.service';
import { CategorieQuiz, getQuizCategories, QuizItem } from '../../services/quiz.service';
import {
  getStockSang,
  GROUPES_SANGUINS,
  NiveauStock,
  StockGroupe,
} from '../../services/stockSang.service';

// 📖 Table niveau de stock → couleur (Colors.status) + libellé lisible affiché
//    sous la goutte. `null` (groupe sans donnée) est géré à part, en gris.
const NIVEAU_LABEL: Record<NiveauStock, string> = {
  critique: 'Critique',
  bas: 'Bas',
  correct: 'Correct',
  bon: 'Bon',
};

const couleurNiveau = (niveau: NiveauStock | null): string =>
  niveau ? Colors.status[niveau] : Colors.fondGris;

// 📖 Style de la carte bannière selon le type. Toutes les valeurs viennent du
//    design system (aucune couleur en dur).
const BANNIERE_STYLE: Record<TypeBanniere, { fond: string; bordure: string; icone: string }> = {
  info: { fond: Colors.fondBleu, bordure: Colors.petrole[500], icone: 'ℹ️' },
  alerte: { fond: Colors.fondOrange, bordure: Colors.status.bas, icone: '⚠️' },
  urgence: { fond: Colors.fondRose, bordure: Colors.corail[600], icone: '🚨' },
};

// 📖 Emoji par catégorie de quiz (repris de l'onglet Quiz pour rester cohérent).
const CATEGORIE_EMOJI: Record<string, string> = {
  'Les bases du don': '🩸',
  'Les groupes sanguins': '🔬',
  "L'association ADSB-NC": '🏥',
};
const emojiCategorie = (categorie: string) => CATEGORIE_EMOJI[categorie] ?? '💡';

// 📖 Nombre d'items visibles « à la fois » dans le rail des stocks → sert à
//    calculer le nombre de points de pagination (progressive disclosure).
const STOCKS_VISIBLES = 5;

export default function AccueilScreen() {
  const router = useRouter();

  // 📖 Un state par section : chaque appel réseau retombe indépendamment, on ne
  //    veut jamais qu'un échec masque les sections qui, elles, ont répondu.
  const [user, setUser] = useState<Profil | null>(null);

  const [banniere, setBanniere] = useState<Banniere | null>(null);
  const [banniereLoading, setBanniereLoading] = useState(true);
  const [banniereError, setBanniereError] = useState(false);

  const [stocks, setStocks] = useState<StockGroupe[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState(false);

  const [defi, setDefi] = useState<DefiActuel | null>(null);
  const [defiLoading, setDefiLoading] = useState(true);
  const [defiError, setDefiError] = useState(false);

  const [quizCategories, setQuizCategories] = useState<CategorieQuiz[]>([]);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [stockPage, setStockPage] = useState(0);

  // 📖 Catégories dépliées dans la section « Quiz en cours ». Un Set : plusieurs
  //    peuvent être ouvertes en même temps, on ajoute/retire une clé sans toucher
  //    aux autres.
  const [openQuiz, setOpenQuiz] = useState<Set<string>>(new Set());
  const toggleQuiz = (categorie: string) => {
    setOpenQuiz((prev) => {
      const next = new Set(prev);
      if (next.has(categorie)) next.delete(categorie);
      else next.add(categorie);
      return next;
    });
  };

  // 📖 Évite un setState après démontage (l'écran peut être quitté avant la fin
  //    des requêtes) → warning React et fuite mémoire potentielle.
  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  // 📖 Chaîne de promesses (pas async/await) : les setState vivent tous dans le
  //    callback `.then`, jamais dans le corps synchrone d'un effet → pas de
  //    « cascading renders ». Les flags *Loading sont déjà à true au montage et
  //    ne sont pas remis à true lors d'un pull-to-refresh (contenu conservé).
  const chargerDonnees = useCallback(() => {
    // 📖 allSettled : on lance les 5 appels en parallèle et on attend que TOUS
    //    soient retombés, qu'ils aient réussi ou échoué. Contrairement à
    //    Promise.all, un rejet n'annule pas les autres résultats.
    return Promise.allSettled([
      getProfil(),
      getBanniere(),
      getStockSang(),
      getDefiActuel(),
      getQuizCategories(),
    ]).then(([profilR, banniereR, stockR, defiR, quizR]) => {
      if (!monte.current) return;

      // Header : pas de message d'erreur dédié, un simple repli visuel suffit.
      setUser(profilR.status === 'fulfilled' ? profilR.value : null);

      if (banniereR.status === 'fulfilled') {
        setBanniere(banniereR.value);
        setBanniereError(false);
      } else {
        setBanniereError(true);
      }
      setBanniereLoading(false);

      if (stockR.status === 'fulfilled') {
        setStocks(stockR.value);
        setStocksError(false);
      } else {
        setStocksError(true);
      }
      setStocksLoading(false);

      if (defiR.status === 'fulfilled') {
        setDefi(defiR.value);
        setDefiError(false);
      } else {
        setDefiError(true);
      }
      setDefiLoading(false);

      if (quizR.status === 'fulfilled') {
        setQuizCategories(quizR.value);
        setQuizError(false);
      } else {
        setQuizError(true);
      }
      setQuizLoading(false);
    });
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerDonnees();
    if (monte.current) setRefreshing(false);
  }, [chargerDonnees]);

  const onScrollStocks = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    if (layoutMeasurement.width > 0) {
      setStockPage(Math.round(contentOffset.x / layoutMeasurement.width));
    }
  };

  // 📖 Un quiz « en cours » = commencé (nb_tentatives > 0) mais pas terminé
  //    (complete === false). On ne garde que les catégories qui en contiennent.
  const categoriesEnCours = useMemo(
    () =>
      quizCategories
        .map((cat) => ({
          categorie: cat.categorie,
          quiz: cat.quiz.filter((q) => !q.complete && q.nb_tentatives > 0),
        }))
        .filter((cat) => cat.quiz.length > 0),
    [quizCategories]
  );
  const nbQuizEnCours = categoriesEnCours.reduce((total, cat) => total + cat.quiz.length, 0);
  const nbDotsStocks = Math.ceil(GROUPES_SANGUINS.length / STOCKS_VISIBLES);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.corail[600]}
          />
        }
      >
        <Header user={user} />

        {/* SECTION 1 — BANNIÈRE ALERTE PÉNURIE */}
        {banniereLoading ? (
          <Skeleton style={styles.skeletonBanniere} />
        ) : (
          // 📖 En erreur, la bannière (contenu non critique) est simplement omise :
          //    le reste de l'accueil doit rester lisible.
          !banniereError && banniere?.active && <BanniereCard banniere={banniere} />
        )}

        {/* SECTION 2 — STOCKS DE SANG */}
        <Text style={styles.sectionTitle}>Stocks de sang</Text>
        {stocksLoading ? (
          <View style={styles.stocksSkeletonRow}>
            {Array.from({ length: STOCKS_VISIBLES }).map((_, i) => (
              <Skeleton key={i} style={styles.skeletonGoutte} />
            ))}
            <ActivityIndicator color={Colors.corail[600]} style={styles.stocksSpinner} />
          </View>
        ) : stocksError ? (
          <Text style={styles.sectionError}>Impossible de charger les stocks.</Text>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={onScrollStocks}
              scrollEventThrottle={16}
              contentContainerStyle={styles.stocksRail}
            >
              {GROUPES_SANGUINS.map((groupe) => {
                const item = stocks.find((s) => s.groupe === groupe);
                const niveau = item?.niveau ?? null;
                const couleur = couleurNiveau(niveau);
                return (
                  <View key={groupe} style={styles.stockItem}>
                    <View style={styles.goutte}>
                      <View style={[styles.goutteFond, { backgroundColor: couleur }]} />
                      <Text style={[styles.goutteLabel, { color: couleur }]}>
                        {niveau ? groupe : '—'}
                      </Text>
                    </View>
                    <Text style={styles.stockNom}>
                      {niveau ? NIVEAU_LABEL[niveau] : 'Non communiqué'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            {nbDotsStocks > 1 && (
              <View style={styles.dots}>
                {Array.from({ length: nbDotsStocks }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === Math.min(stockPage, nbDotsStocks - 1) && styles.dotActif]}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* SECTION 3 — DÉFI DU MOIS */}
        {defiLoading ? (
          <Skeleton style={styles.skeletonDefi} />
        ) : (
          // 📖 Masquée si aucun défi (defi === null) ou si l'appel a échoué :
          //    section d'animation, non bloquante.
          !defiError && defi && <DefiCard defi={defi} />
        )}

        {/* SECTION 4 — QUIZ EN COURS */}
        {quizLoading ? (
          <>
            <Text style={styles.sectionTitle}>Quiz en cours</Text>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} style={styles.skeletonQuiz} />
            ))}
          </>
        ) : (
          // 📖 Erreur ou aucun quiz en cours → section entièrement masquée
          //    (pas de bloc d'erreur : contenu de re-engagement, non essentiel).
          !quizError &&
          categoriesEnCours.length > 0 && (
            <>
              <View style={styles.quizTitreRow}>
                <Text style={styles.sectionTitle}>Quiz en cours</Text>
                <View style={styles.quizCountBadge}>
                  <Text style={styles.quizCountText}>{nbQuizEnCours}</Text>
                </View>
              </View>

              {categoriesEnCours.map((cat) => {
                const ouvert = openQuiz.has(cat.categorie);
                return (
                  <View key={cat.categorie} style={styles.quizCard}>
                    <TouchableOpacity
                      style={styles.quizCardHeader}
                      onPress={() => toggleQuiz(cat.categorie)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                    >
                      <View style={styles.quizIconCircle}>
                        <Text style={styles.quizIconEmoji}>{emojiCategorie(cat.categorie)}</Text>
                      </View>
                      <View style={styles.quizCardCenter}>
                        <Text style={styles.quizCardTitre}>{cat.categorie}</Text>
                        <Text style={styles.quizCardSousTitre}>
                          {cat.quiz.length} quiz en cours
                        </Text>
                      </View>
                      <Ionicons
                        name={ouvert ? 'chevron-down' : 'chevron-forward'}
                        size={18}
                        color={Colors.grisMoyen}
                      />
                    </TouchableOpacity>

                    {ouvert &&
                      cat.quiz.map((quiz) => (
                        <QuizEnCoursCard
                          key={quiz.id}
                          quiz={quiz}
                          onReprendre={() =>
                            router.push({
                              pathname: '/tabs/quiz/[id]',
                              params: { id: quiz.id },
                            })
                          }
                        />
                      ))}
                  </View>
                );
              })}
            </>
          )
        )}
      </ScrollView>
    </View>
  );
}

// 📖 Sous-carte d'un quiz commencé : titre + avancement (questions_repondues /
//    nb_questions), barre de progression et bouton « Reprendre » qui ouvre
//    directement ce quiz. Même rendu que l'onglet Quiz pour rester cohérent.
function QuizEnCoursCard({ quiz, onReprendre }: { quiz: QuizItem; onReprendre: () => void }) {
  const pct = quiz.nb_questions > 0 ? (quiz.questions_repondues / quiz.nb_questions) * 100 : 0;
  return (
    <View style={styles.quizSubCard}>
      <View style={styles.quizSubRow}>
        <Text style={styles.quizSubTitre}>{quiz.titre}</Text>
        <Text style={styles.quizSubMeta}>
          {quiz.questions_repondues}/{quiz.nb_questions} questions
        </Text>
      </View>
      <View style={styles.quizProgressRow}>
        <View style={styles.quizTrack}>
          <View style={[styles.quizFill, { width: `${pct}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.reprendreBtn}
          onPress={onReprendre}
          accessibilityRole="button"
        >
          <Text style={styles.reprendreBtnText}>Reprendre</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 📖 Header personnalisé : avatar + « Hello! » + pseudo à gauche, points + cloche
//    à droite. Profil non chargé → repli « — ★ » / « ? », jamais de spinner.
function Header({ user }: { user: Profil | null }) {
  const initiale = user?.pseudo ? user.pseudo.charAt(0).toUpperCase() : '?';
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initiale}</Text>
        </View>
        <View style={styles.headerInfos}>
          <Text style={styles.hello}>Hello!</Text>
          {user?.pseudo ? <Text style={styles.pseudo}>{user.pseudo}</Text> : null}
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>{user ? `${user.points_cumules} ★` : '— ★'}</Text>
        </View>
        <Text style={styles.cloche}>🔔</Text>
      </View>
    </View>
  );
}

function BanniereCard({ banniere }: { banniere: Banniere }) {
  const style = BANNIERE_STYLE[banniere.type];
  return (
    <View
      style={[styles.banniere, { backgroundColor: style.fond, borderColor: style.bordure }]}
    >
      <Text style={styles.banniereIcone}>{style.icone}</Text>
      <View style={styles.banniereContenu}>
        <Text style={styles.banniereTitre}>{banniere.titre}</Text>
        <Text style={styles.banniereMessage}>{banniere.message}</Text>
      </View>
    </View>
  );
}

function DefiCard({ defi }: { defi: DefiActuel }) {
  // 📖 Bornée à 100 % : la progression réelle peut dépasser l'objectif.
  const pct = Math.min((defi.progression_actuelle / defi.objectif_chiffre) * 100, 100);
  return (
    <>
      <Text style={styles.sectionTitle}>Défi du mois</Text>
      <View style={styles.defiCard}>
        <View style={styles.defiBlob} />
        <Text style={styles.defiTitre}>{defi.titre}</Text>
        <Text style={styles.defiProgressionLabel}>Progression</Text>
        <View style={styles.defiBarreRow}>
          <View style={styles.defiTrack}>
            <View style={[styles.defiFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.defiValeur}>
            {defi.progression_actuelle}/{defi.objectif_chiffre}
          </Text>
        </View>
      </View>
    </>
  );
}

// 📖 Skeleton : bloc gris dont l'opacité oscille en boucle. Occupe la place
//    exacte du futur contenu → pas de saut de layout, attente perçue plus courte
//    qu'avec un spinner plein écran.
function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  // 📖 useState avec initialiseur paresseux : l'Animated.Value est créée une
  //    seule fois et n'est jamais lue pendant le rendu (contrairement à un ref).
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ])
    );
    boucle.start();
    return () => boucle.stop();
  }, [opacity]);
  return <Animated.View style={[styles.skeleton, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 54,
    // 📖 La tab bar flottante (bottom 15, hauteur 72) recouvrirait la fin du
    //    contenu avec seulement 32 : on réserve la place.
    paddingBottom: 120,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.grisMoyen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.blanc,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfos: {
    marginLeft: 12,
  },
  hello: {
    fontSize: 14,
    color: Colors.grisMoyen,
  },
  pseudo: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: Colors.fondGris,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsBadgeText: {
    color: Colors.aubergine,
    fontSize: 13,
    fontWeight: '700',
  },
  cloche: {
    fontSize: 20,
    marginLeft: 8,
  },

  // SECTIONS
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 12,
  },
  sectionError: {
    color: Colors.grisMoyen,
    fontSize: 13,
    marginBottom: 16,
  },

  // BANNIÈRE
  banniere: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  banniereIcone: {
    fontSize: 20,
    marginRight: 12,
  },
  banniereContenu: {
    flex: 1,
  },
  banniereTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  banniereMessage: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginTop: 4,
  },

  // STOCKS
  stocksRail: {
    paddingRight: 16,
    paddingBottom: 4,
  },
  stockItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 56,
  },
  goutte: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // 📖 Fond coloré à 15 % posé DERRIÈRE le label : `opacity` sur la vue
  //    n'affecte que ce calque, pas le texte (contrairement à opacity sur le
  //    parent qui atténuerait aussi le label).
  goutteFond: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  goutteLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockNom: {
    fontSize: 11,
    color: Colors.grisMoyen,
    marginTop: 4,
    textAlign: 'center',
  },
  stocksSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stocksSpinner: {
    marginLeft: 4,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.fondGris,
    marginHorizontal: 3,
  },
  dotActif: {
    backgroundColor: Colors.corail[600],
  },

  // DÉFI
  defiCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  defiBlob: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.creme,
    opacity: 0.5,
  },
  defiTitre: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 4,
    maxWidth: '75%',
  },
  defiProgressionLabel: {
    fontSize: 12,
    color: Colors.grisMoyen,
    marginBottom: 8,
  },
  defiBarreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defiTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.fondGris,
    marginRight: 8,
    overflow: 'hidden',
  },
  defiFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.corail[600],
  },
  defiValeur: {
    fontSize: 12,
    color: Colors.grisMoyen,
  },

  // QUIZ
  quizTitreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizCountBadge: {
    backgroundColor: Colors.aubergine,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  quizCountText: {
    color: Colors.blanc,
    fontSize: 12,
    fontWeight: '700',
  },
  quizCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quizCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quizIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.fondNeutre,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizIconEmoji: {
    fontSize: 18,
  },
  quizCardCenter: {
    flex: 1,
    marginLeft: 12,
  },
  quizCardTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  quizCardSousTitre: {
    fontSize: 12,
    color: Colors.grisMoyen,
    marginTop: 2,
  },
  quizSubCard: {
    backgroundColor: Colors.fondGrisClair,
    borderRadius: 8,
    margin: 8,
    marginTop: 0,
    padding: 12,
  },
  quizSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizSubTitre: {
    flex: 1,
    fontSize: 14,
    color: Colors.aubergine,
    marginRight: 8,
  },
  quizSubMeta: {
    fontSize: 12,
    color: Colors.grisMoyen,
  },
  quizProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quizTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.fondGris,
    marginRight: 12,
    overflow: 'hidden',
  },
  quizFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.corail[600],
  },
  reprendreBtn: {
    backgroundColor: Colors.aubergine,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  reprendreBtnText: {
    color: Colors.blanc,
    fontSize: 13,
    fontWeight: '700',
  },

  // SKELETON
  skeleton: {
    backgroundColor: Colors.fondGris,
    borderRadius: 8,
  },
  skeletonBanniere: {
    height: 84,
    marginBottom: 16,
  },
  skeletonGoutte: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  skeletonDefi: {
    height: 132,
    marginBottom: 16,
  },
  skeletonQuiz: {
    height: 72,
    marginBottom: 8,
  },
});
