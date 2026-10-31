import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlocStocks } from '../../components/accueil/BlocStocks';
import { BanniereAccueil } from '../../components/accueil/BanniereAccueil';
import { BlocDefi } from '../../components/accueil/BlocDefi';
import { CarrouselActualites } from '../../components/accueil/CarrouselActualites';
import { LigneEvenement } from '../../components/accueil/LigneEvenement';
import { EnTete } from '../../components/EnTete';
import { Bouton } from '../../components/ui/Bouton';
import { Chargement } from '../../components/ui/Chargement';
import { EtatErreur } from '../../components/ui/EtatErreur';
import { EtatVide } from '../../components/ui/EtatVide';
import { entree } from '../../constants/animations';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { useNotificationsNonLues } from '../../hooks/useNotificationsNonLues';
import { useRelanceOnglet } from '../../hooks/useRelanceOnglet';
import { Actualite, getActualites } from '../../services/actualites.service';
import { Banniere, getBanniere } from '../../services/bannieres.service';
import { DefiActuel, getDefiActuel } from '../../services/defis.service';
import { Evenement, getEvenements } from '../../services/evenements.service';
import { getProfil, Profil } from '../../services/profil.service';
import { getStockSang, StockGroupe } from '../../services/stockSang.service';
import { initialePseudo } from '../../utils/profil';

const RESERVATION_URL = 'https://www.dondusang.nc/reservation-en-ligne/';

// 📖 Nombre d'événements affichés par défaut (les suivants derrière « Voir tous »).
const EVENEMENTS_APERCU = 3;

// 📖 Attente maximale des autres sections une fois les réserves arrivées : assez pour que
//    tout arrive ensemble, en cascade, sur un réseau normal ; pas assez pour faire attendre.
const DELAI_CASCADE_MS = 1500;

export default function AccueilScreen() {
  // Appui sur l'onglet : retour en haut de la page et animations d'entrée rejouées.
  const cleOnglet = useRelanceOnglet('index');
  const router = useRouter();
  const notificationsNonLues = useNotificationsNonLues();

  // 📖 Un state par section : chaque appel réseau retombe indépendamment, on ne
  //    veut jamais qu'un échec ou une lenteur masque les sections qui, elles, ont répondu.
  const [user, setUser] = useState<Profil | null>(null);
  const [banniere, setBanniere] = useState<Banniere | null>(null);
  // `null` : niveaux impossibles à charger (le bandeau le dit, sans disparaître).
  const [stocks, setStocks] = useState<StockGroupe[] | null>(null);
  const [defi, setDefi] = useState<DefiActuel | null>(null);
  // `null` : pas encore reçues. La rubrique attend, au lieu d'annoncer « pas d'actualité ».
  const [actualites, setActualites] = useState<Actualite[] | null>(null);
  const [evenements, setEvenements] = useState<Evenement[]>([]);

  // 📖 Chargement global, pour l'effet de cascade : on attend les réserves (l'information
  //    principale), puis au plus DELAI_CASCADE_MS que le reste arrive. Une requête lente
  //    (timeout axios : 10 s) ne cache donc plus les réserves derrière le chargement :
  //    une section en retard s'ajoute dès qu'elle répond.
  const [chargement, setChargement] = useState(true);
  // Rien n'a jamais pu être chargé : on propose de réessayer plutôt qu'une page vide.
  const [erreurTotale, setErreurTotale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // 📖 Bascule « 3 événements » ↔ « tous » (bouton « Voir tous »).
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

  // 📖 Vrai dès qu'un chargement a réussi au moins une fois. Si un rafraîchissement échoue
  //    ensuite (réseau coupé), chaque section garde ses dernières données au lieu de les
  //    remplacer par une erreur ou un état vide.
  const aDejaCharge = useRef(false);
  // Vrai quand un rafraîchissement a échoué alors que des données sont affichées :
  // ce qu'on voit n'est peut-être plus à jour.
  const [horsLigne, setHorsLigne] = useState(false);

  // 📖 Chaîne de promesses (pas async/await) : les setState vivent tous dans des
  //    callbacks `.then`, jamais dans le corps synchrone d'un effet → pas de
  //    « cascading renders ».
  const chargerDonnees = useCallback(() => {
    const donneesAffichees = aDejaCharge.current;

    // Chaque section prend ses données dès que sa requête répond. Un échec la laisse
    // telle quelle : repli de l'en-tête, section masquée, ou dernières données connues.
    const section = <T,>(requete: Promise<T>, appliquer: (valeur: T) => void) =>
      requete.then((valeur) => {
        if (!monte.current) return;
        appliquer(valeur);
        aDejaCharge.current = true;
      });

    const stocksR = section(getStockSang(), setStocks);
    const requetes = [
      section(getProfil(), setUser),
      section(getBanniere(), setBanniere),
      stocksR,
      section(getDefiActuel(), setDefi),
      section(getActualites(), setActualites),
      section(getEvenements(), setEvenements),
    ];

    // Fin du chargement global : les réserves sont arrivées et le délai est passé, sans
    // attendre une requête plus lente. `toutes` le termine aussi, si tout répond avant.
    // 📖 Type du minuteur laissé à l'inférence (const) : selon les types chargés, setTimeout
    //    renvoie un `number` (navigateur) ou un `Timeout` (Node), et une annotation
    //    explicite ne compilait pas partout (échec du typecheck en CI).
    let annulerDelai = () => {};
    const delai = new Promise((fin) => {
      const minuteur = setTimeout(fin, DELAI_CASCADE_MS);
      annulerDelai = () => clearTimeout(minuteur);
    });

    // 📖 allSettled : un rejet n'annule pas les autres résultats (contrairement à Promise.all).
    const toutes = Promise.allSettled(requetes).then((resultats) => {
      annulerDelai();
      if (!monte.current) return;

      const echec = resultats.some((r) => r.status === 'rejected');
      setErreurTotale(resultats.every((r) => r.status === 'rejected') && !donneesAffichees);
      setHorsLigne(echec && donneesAffichees);
      // 📖 Actualités en échec au premier chargement : l'état vide (rubrique censée
      //    toujours avoir du contenu), plutôt qu'une rubrique qui attend pour toujours.
      setActualites((actuelles) => actuelles ?? []);
      setChargement(false);
    });

    // Réserves en échec : on attend `toutes`, qui saura s'il faut proposer de réessayer.
    Promise.all([stocksR, delai])
      .then(() => {
        if (monte.current) setChargement(false);
      })
      .catch(() => {});

    return toutes;
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerDonnees();
    if (monte.current) setRefreshing(false);
  }, [chargerDonnees]);

  const ouvrirActualite = (item: Actualite, teinte: string) =>
    router.push({
      pathname: '/detail/actualite/[id]',
      params: {
        id: String(item.id),
        teinte,
        titre: item.titre,
        chapo: item.chapo ?? '',
        contenu: item.contenu ?? '',
        published_at: item.published_at,
        image_url: item.image_url ?? '',
      },
    });

  const ouvrirEvenement = (evenement: Evenement) =>
    router.push({
      pathname: '/detail/evenement/[id]',
      params: {
        id: String(evenement.id),
        titre: evenement.titre,
        description: evenement.description ?? '',
        date_heure: evenement.date_heure,
        horaire_fin: evenement.horaire_fin ?? '',
        lieu: evenement.lieu,
        image_url: evenement.image_url ?? '',
      },
    });

  // 📖 Événements déjà triés par date croissante côté service.
  const evenementsAffiches = tousEvenements ? evenements : evenements.slice(0, EVENEMENTS_APERCU);
  const avecBanniere = !!banniere?.active;
  // Rang de chaque section dans la cascade d'arrivée : une section absente ne laisse pas de trou.
  const rangStocks = avecBanniere ? 1 : 0;
  const rangActualites = rangStocks + (defi ? 2 : 1);

  return (
    <View style={styles.screen}>
      <ScrollView
        key={cleOnglet}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.marque.principal} />
        }
      >
        {/* 📖 Profil non chargé → repli « ? » / 0 point, jamais de spinner :
            l'en-tête ne doit pas retarder l'affichage du reste de l'accueil. */}
        <EnTete
          variante="accueil"
          pseudo={user?.pseudo ?? ''}
          initiale={initialePseudo(user?.pseudo)}
          avatarId={user?.avatar_id}
          points={user?.points_cumules ?? 0}
          profil={user}
          notificationsNonLues={notificationsNonLues}
          onPressNotifications={() => router.push('/notifications')}
        />

        {(chargement || erreurTotale) && (
          <View style={styles.etat}>
            {chargement && <Chargement message="On prépare ton accueil…" />}
            {!chargement && erreurTotale && (
              <EtatErreur
                titre="L’accueil fait une pause"
                message="Vérifie ton réseau puis réessaie."
                onReessayer={() => {
                  setErreurTotale(false);
                  setChargement(true);
                  chargerDonnees();
                }}
              />
            )}
          </View>
        )}

        {!chargement && !erreurTotale && (
          <>
            {horsLigne && (
              <View style={styles.horsLigne} accessibilityLiveRegion="polite">
                <Ionicons name="cloud-offline-outline" size={16} color={Theme.texte.secondaire} />
                <Text style={[Typo.legende, styles.secondaire]}>Données non actualisées, vérifie ta connexion.</Text>
              </View>
            )}

            {/* 📖 Les sections arrivent en cascade, comme sur les autres pages principales. */}
            {avecBanniere && banniere && (
              <Animated.View entering={entree(0)}>
                <BanniereAccueil banniere={banniere} />
              </Animated.View>
            )}

            <Animated.View entering={entree(rangStocks)}>
              <BlocStocks stocks={stocks} onPrendreRendezVous={() => Linking.openURL(RESERVATION_URL)} />
            </Animated.View>

            {/* 📖 Masqué s'il n'y a aucun défi en cours : section d'animation, non bloquante. */}
            {defi && (
              <Animated.View entering={entree(rangStocks + 1)} style={styles.section}>
                <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                  Défi du mois
                </Text>
                <BlocDefi defi={defi} />
              </Animated.View>
            )}

            {/* 📖 Pas encore reçues (requête lente) : la rubrique arrive dès qu'elles répondent. */}
            {actualites && (
              <Animated.View entering={entree(rangActualites)} style={styles.section}>
                <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                  Actualités
                </Text>
                {actualites.length > 0 ? (
                  <CarrouselActualites actualites={actualites} onOuvrir={ouvrirActualite} marge={MARGE} />
                ) : (
                  <EtatVide
                    titre="Pas encore d’actualité"
                    message="Reviens bientôt pour les dernières nouvelles de l’association ADSB-NC."
                  />
                )}
              </Animated.View>
            )}

            {/* 📖 Rien du tout si aucun événement : c'est l'état NORMAL la plupart du
                temps (contenu épisodique) → pas d'état vide, qui serait du bruit. */}
            {evenements.length > 0 && (
              <Animated.View entering={entree(rangActualites + 1)} style={styles.section}>
                <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                  Événements à venir
                </Text>
                {evenementsAffiches.map((evenement, i) => (
                  <Animated.View
                    key={evenement.id}
                    // Les événements dévoilés par « Voir tous » glissent à leur tour.
                    entering={i >= EVENEMENTS_APERCU ? FadeInDown.delay(Math.min(i - EVENEMENTS_APERCU, 5) * 60).duration(250) : undefined}
                  >
                    <LigneEvenement evenement={evenement} onPress={() => ouvrirEvenement(evenement)} />
                  </Animated.View>
                ))}
                {evenements.length > EVENEMENTS_APERCU && (
                  <Bouton
                    libelle={tousEvenements ? 'Réduire' : `Voir tous les événements (${evenements.length})`}
                    variante="discret"
                    icone={tousEvenements ? 'chevron-up' : 'chevron-down'}
                    onPress={() => setTousEvenements((v) => !v)}
                  />
                )}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const MARGE = Espace[4];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    // flexGrow : le contenu occupe au moins tout l'écran, pour pouvoir centrer un état.
    flexGrow: 1,
    padding: MARGE,
    paddingTop: 54,
    // 📖 La tab bar flottante recouvrirait la fin du contenu : on réserve la place.
    paddingBottom: 126,
    gap: Espace[6],
  },
  etat: {
    flex: 1,
    justifyContent: 'center',
  },
  section: {
    gap: Espace[3],
  },
  sectionTitre: {
    color: Theme.texte.principal,
  },
  secondaire: {
    color: Theme.texte.secondaire,
    flexShrink: 1,
  },
  horsLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Espace[2],
    paddingHorizontal: Espace[3],
    paddingVertical: Espace[1],
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surfaceEnfoncee,
    // Collé au bloc suivant : il le concerne, il ne forme pas une section à lui seul.
    marginBottom: -Espace[3],
  },
});
