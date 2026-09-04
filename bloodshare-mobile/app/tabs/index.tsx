import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
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
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Actualite, getActualites } from '../../services/actualites.service';
import { Banniere, getBanniere, TypeBanniere } from '../../services/bannieres.service';
import { DefiActuel, getDefiActuel } from '../../services/defis.service';
import { Evenement, getEvenements } from '../../services/evenements.service';
import { getProfil, Profil } from '../../services/profil.service';
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

// 📖 Nombre d'items visibles « à la fois » dans le rail des stocks → sert à
//    calculer le nombre de points de pagination (progressive disclosure).
const STOCKS_VISIBLES = 5;

// 📖 Dimensions du carousel d'actualités. Le pas de snap = largeur carte + marge.
//    Constantes (pas des valeurs magiques éparpillées) : réutilisées par le
//    style, par snapToInterval ET par getItemLayout → une seule source de vérité.
const ACTU_CARD_WIDTH = 260;
const ACTU_CARD_MARGIN = 12;
const ACTU_SNAP = ACTU_CARD_WIDTH + ACTU_CARD_MARGIN; // 272

// 📖 Nombre d'événements affichés par défaut (les suivants derrière « Voir tout »).
const EVENEMENTS_APERCU = 3;

// 📖 Mois abrégés FR figés. Explicite plutôt que toLocaleDateString({month:'short'})
//    dont les abréviations varient selon l'OS / la locale installée.
const MOIS_ABREGES = [
  'JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN',
  'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC',
];

// 📖 "2026-07-02T09:00:00Z" → "09h00". timeZone UTC : l'heure affichée = l'heure
//    stockée, sans décalage selon le fuseau de l'appareil.
const formatHeure = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    .replace(':', 'h');

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

  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [actualitesLoading, setActualitesLoading] = useState(true);
  const [actualitesError, setActualitesError] = useState(false);

  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [evenementsLoading, setEvenementsLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [stockPage, setStockPage] = useState(0);
  // 📖 Index de la carte d'actualité centrée → pilote les dots de pagination.
  const [actuIndex, setActuIndex] = useState(0);
  // 📖 Bascule « 3 événements » ↔ « tous » (bouton « Voir tout »).
  const [tousEvenements, setTousEvenements] = useState(false);

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
    // 📖 allSettled : on lance les 6 appels en parallèle et on attend que TOUS
    //    soient retombés, qu'ils aient réussi ou échoué. Contrairement à
    //    Promise.all, un rejet n'annule pas les autres résultats.
    //    Les actualités/événements rejoignent ce bloc plutôt qu'un useEffect
    //    séparé → le pull-to-refresh (qui rappelle chargerDonnees) les recharge
    //    sans code en plus, et la garde monte.current / la gestion d'erreur
    //    restent mutualisées.
    return Promise.allSettled([
      getProfil(),
      getBanniere(),
      getStockSang(),
      getDefiActuel(),
      getActualites(),
      getEvenements(),
    ]).then(([profilR, banniereR, stockR, defiR, actusR, eventsR]) => {
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

      // 📖 Actualités : en erreur on affiche l'état vide (rubrique censée toujours
      //    avoir du contenu → on rassure plutôt que de masquer).
      if (actusR.status === 'fulfilled') {
        setActualites(actusR.value);
        setActualitesError(false);
      } else {
        setActualites([]);
        setActualitesError(true);
      }
      setActualitesLoading(false);

      // 📖 Événements : pas de state d'erreur. Échec = liste vide = section
      //    entièrement masquée (contenu épisodique, non bloquant).
      setEvenements(eventsR.status === 'fulfilled' ? eventsR.value : []);
      setEvenementsLoading(false);
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

  // 📖 Index de la carte centrée = décalage horizontal / pas de snap, arrondi.
  //    On borne pour ne jamais dépasser le dernier dot (dernière carte + padding).
  const onScrollActus = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / ACTU_SNAP);
    setActuIndex(Math.max(0, Math.min(index, actualites.length - 1)));
  };

  const nbDotsStocks = Math.ceil(GROUPES_SANGUINS.length / STOCKS_VISIBLES);

  // 📖 Événements déjà triés par date croissante côté service. On coupe à 3 sauf
  //    si l'utilisateur a demandé « Voir tout ».
  const evenementsAffiches = tousEvenements
    ? evenements
    : evenements.slice(0, EVENEMENTS_APERCU);

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

        {/* SECTION 4 — ACTUALITÉS */}
        <Text style={styles.sectionTitle}>Actualités</Text>
        {actualitesLoading ? (
          <ActualitesSkeleton />
        ) : actualites.length === 0 ? (
          <View style={styles.actuVide}>
            <Text style={styles.actuVideEmoji}>📰</Text>
            <Text style={styles.actuVideTitre}>Aucune actualité pour le moment</Text>
            <Text style={styles.actuVideTexte}>
              Revenez bientôt pour les dernières nouvelles de l&apos;association ADSB-NC.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={actualites}
              horizontal
              showsHorizontalScrollIndicator={false}
              // 📖 Clé stable = identité métier. Sans elle, FlatList retombe sur
              //    l'index → mauvaise réconciliation quand la liste change au refresh.
              keyExtractor={(item) => String(item.id)}
              // 📖 Toutes les cartes ont la même largeur fixe (ACTU_SNAP) → on peut
              //    donner la géométrie sans mesure : rendu initial instantané,
              //    scrollToIndex fiable, zéro jank.
              getItemLayout={(_, index) => ({
                length: ACTU_SNAP,
                offset: ACTU_SNAP * index,
                index,
              })}
              snapToInterval={ACTU_SNAP}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={onScrollActus}
              scrollEventThrottle={16}
              contentContainerStyle={styles.actuRail}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.actuCard} activeOpacity={0.9}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.actuImage} />
                  ) : (
                    <View style={styles.actuImagePlaceholder}>
                      <Text style={styles.actuImagePlaceholderEmoji}>📰</Text>
                    </View>
                  )}
                  {/* 📖 Voile aubergine translucide en bas de l'image : contraste
                      si un jour un titre est incrusté, cohérence visuelle. */}
                  <View style={styles.actuOverlay} />
                  <View style={styles.actuTexte}>
                    <Text style={styles.actuTitre} numberOfLines={2}>
                      {item.titre}
                    </Text>
                    <Text style={styles.actuDate}>
                      {new Date(item.published_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        timeZone: 'UTC',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            {actualites.length > 1 && (
              <View style={styles.dots}>
                {actualites.map((actu, i) => (
                  <View
                    key={actu.id}
                    style={[styles.dot, i === actuIndex && styles.dotActif]}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* SECTION 5 — ÉVÉNEMENTS À VENIR */}
        {/* 📖 Rien du tout si aucun événement : c'est l'état NORMAL la plupart du
            temps (contenu épisodique) → pas d'état vide, qui serait du bruit. */}
        {!evenementsLoading && evenements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Événements à venir</Text>
            {evenementsAffiches.map((evenement) => (
              <TouchableOpacity
                key={evenement.id}
                style={styles.eventCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/tabs/accueil/evenement/[id]',
                    params: {
                      id: String(evenement.id),
                      titre: evenement.titre,
                      description: evenement.description ?? '',
                      date_heure: evenement.date_heure,
                      horaire_fin: evenement.horaire_fin ?? '',
                      lieu: evenement.lieu,
                      image_url: evenement.image_url ?? '',
                    },
                  })
                }
              >
                <View style={styles.eventRow}>
                  <View style={styles.eventDateBloc}>
                    <Text style={styles.eventJour}>
                      {new Date(evenement.date_heure).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        timeZone: 'UTC',
                      })}
                    </Text>
                    <Text style={styles.eventMois}>
                      {MOIS_ABREGES[new Date(evenement.date_heure).getUTCMonth()]}
                    </Text>
                  </View>
                  <View style={styles.eventContenu}>
                    <Text style={styles.eventTitre} numberOfLines={1}>
                      {evenement.titre}
                    </Text>
                    <View style={styles.eventLigne}>
                      <Text style={styles.eventIcone}>📍</Text>
                      <Text style={styles.eventInfo} numberOfLines={1}>
                        {evenement.lieu}
                      </Text>
                    </View>
                    <View style={styles.eventLigne}>
                      <Text style={styles.eventIcone}>🕐</Text>
                      <Text style={styles.eventInfoPetit}>
                        {evenement.horaire_fin
                          ? `${formatHeure(evenement.date_heure)} → ${formatHeure(evenement.horaire_fin)}`
                          : formatHeure(evenement.date_heure)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.eventChevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
            {evenements.length > EVENEMENTS_APERCU && (
              <TouchableOpacity
                onPress={() => setTousEvenements((v) => !v)}
                style={styles.eventVoirTout}
              >
                <Text style={styles.eventVoirToutText}>
                  {tousEvenements
                    ? 'Réduire'
                    : `Voir tous les événements (${evenements.length}) →`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

      </ScrollView>
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

// 📖 Skeleton du carousel : 3 blocs à la forme exacte d'une carte d'actualité,
//    dont l'opacité pulse en boucle. Meilleur qu'un spinner ici : la forme est
//    prévisible → l'attente est « meublée » et il n'y a aucun saut de layout
//    quand les vraies cartes arrivent.
function ActualitesSkeleton() {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    // 📖 sequence = fondu descendant puis remontant ; loop = à l'infini →
    //    pulsation « respiration ». useNativeDriver : tourne hors thread JS.
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    boucle.start();
    return () => boucle.stop();
  }, [opacity]);

  return (
    <View style={styles.actuRail}>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={[styles.actuSkeleton, { opacity }]} />
      ))}
    </View>
  );
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

  // ACTUALITÉS
  actuRail: {
    paddingRight: 16,
    paddingBottom: 4,
  },
  actuSkeleton: {
    width: ACTU_CARD_WIDTH,
    height: 160,
    marginRight: ACTU_CARD_MARGIN,
    borderRadius: 12,
    backgroundColor: Colors.fondGris,
  },
  actuCard: {
    width: ACTU_CARD_WIDTH,
    marginRight: ACTU_CARD_MARGIN,
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actuImage: {
    width: '100%',
    height: 120,
  },
  actuImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.creme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actuImagePlaceholderEmoji: {
    fontSize: 32,
    color: Colors.grisMoyen,
  },
  actuOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 80,
    height: 40,
    backgroundColor: Colors.aubergine,
    opacity: 0.3,
  },
  actuTexte: {
    padding: 12,
  },
  actuTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  actuDate: {
    fontSize: 11,
    color: Colors.grisMoyen,
    marginTop: 4,
  },
  actuVide: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  actuVideEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  actuVideTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  actuVideTexte: {
    fontSize: 13,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 4,
  },

  // ÉVÉNEMENTS
  eventCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDateBloc: {
    backgroundColor: Colors.corail[600],
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 52,
  },
  eventJour: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.blanc,
  },
  eventMois: {
    fontSize: 11,
    color: Colors.blanc,
    textTransform: 'uppercase',
  },
  eventContenu: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  eventLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  eventIcone: {
    fontSize: 12,
    marginRight: 4,
  },
  eventInfo: {
    flex: 1,
    fontSize: 13,
    color: Colors.grisMoyen,
  },
  eventInfoPetit: {
    fontSize: 12,
    color: Colors.grisMoyen,
  },
  eventChevron: {
    fontSize: 18,
    color: Colors.grisMoyen,
    marginLeft: 8,
  },
  eventVoirTout: {
    marginTop: 8,
  },
  eventVoirToutText: {
    fontSize: 14,
    color: Colors.petrole[500],
    textAlign: 'center',
  },
});
