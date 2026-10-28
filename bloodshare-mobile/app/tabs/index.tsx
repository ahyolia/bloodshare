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

export default function AccueilScreen() {
  // Appui sur l'onglet : retour en haut de la page et animations d'entrée rejouées.
  const cleOnglet = useRelanceOnglet('index');
  const router = useRouter();
  const notificationsNonLues = useNotificationsNonLues();

  // 📖 Un state par section : chaque appel réseau retombe indépendamment, on ne
  //    veut jamais qu'un échec masque les sections qui, elles, ont répondu.
  const [user, setUser] = useState<Profil | null>(null);
  const [banniere, setBanniere] = useState<Banniere | null>(null);
  // `null` : niveaux impossibles à charger (le bandeau le dit, sans disparaître).
  const [stocks, setStocks] = useState<StockGroupe[] | null>(null);
  const [defi, setDefi] = useState<DefiActuel | null>(null);
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);

  // 📖 Un seul indicateur : les six appels sont attendus ensemble (allSettled), les
  //    sections arrivent donc toutes en même temps, en cascade.
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

  // 📖 Sections dont au moins un chargement a réussi. Si un rafraîchissement échoue
  //    ensuite (réseau coupé), on garde leurs dernières données au lieu de les remplacer
  //    par une erreur ou un état vide.
  const dejaCharge = useRef({
    user: false,
    banniere: false,
    stocks: false,
    defi: false,
    actualites: false,
    evenements: false,
  });
  // Vrai quand un rafraîchissement a échoué alors que des données sont affichées :
  // ce qu'on voit n'est peut-être plus à jour.
  const [horsLigne, setHorsLigne] = useState(false);

  // 📖 Chaîne de promesses (pas async/await) : les setState vivent tous dans le
  //    callback `.then`, jamais dans le corps synchrone d'un effet → pas de
  //    « cascading renders ».
  const chargerDonnees = useCallback(() => {
    // 📖 allSettled : un rejet n'annule pas les autres résultats (contrairement à Promise.all).
    return Promise.allSettled([
      getProfil(),
      getBanniere(),
      getStockSang(),
      getDefiActuel(),
      getActualites(),
      getEvenements(),
    ]).then(([profilR, banniereR, stockR, defiR, actusR, eventsR]) => {
      if (!monte.current) return;

      const charge = dejaCharge.current;
      const donneesAffichees = Object.values(charge).some(Boolean);
      const resultats = [profilR, banniereR, stockR, defiR, actusR, eventsR];
      const echec = resultats.some((r) => r.status === 'rejected');

      // En-tête : pas de message d'erreur dédié, un simple repli visuel suffit.
      if (profilR.status === 'fulfilled') {
        setUser(profilR.value);
        charge.user = true;
      }

      // 📖 Bannière, défi, événements : contenus non critiques, simplement masqués en erreur.
      if (banniereR.status === 'fulfilled') {
        setBanniere(banniereR.value);
        charge.banniere = true;
      }

      if (stockR.status === 'fulfilled') {
        setStocks(stockR.value);
        charge.stocks = true;
      }

      if (defiR.status === 'fulfilled') {
        setDefi(defiR.value);
        charge.defi = true;
      }

      // 📖 Actualités : en erreur, l'état vide (rubrique censée toujours avoir du contenu).
      if (actusR.status === 'fulfilled') {
        setActualites(actusR.value);
        charge.actualites = true;
      }

      if (eventsR.status === 'fulfilled') {
        setEvenements(eventsR.value);
        charge.evenements = true;
      }

      setErreurTotale(resultats.every((r) => r.status === 'rejected') && !donneesAffichees);
      setHorsLigne(echec && donneesAffichees);
      setChargement(false);
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
