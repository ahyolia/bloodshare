import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { BoutonNotifications } from "../../../components/EnTete";
import { Avatar } from "../../../components/ui/Avatar";
import { NiveauModal } from "../../../components/layout/NiveauModal";
import { Bouton } from "../../../components/ui/Bouton";
import { CarteChiffre } from "../../../components/ui/CarteChiffre";
import { Chargement } from "../../../components/ui/Chargement";
import { ElementListe } from "../../../components/ui/ElementListe";
import { EtatErreur } from "../../../components/ui/EtatErreur";
import { Groupe, Separateur } from "../../../components/ui/Groupe";
import { entree } from "../../../constants/animations";
import { Theme } from "../../../constants/colors";
import { accorder, compter } from "../../../utils/pluriel";
import { Palette } from "../../../constants/palette";
import { Espace, Ombre, Rayon } from "../../../constants/spacing";
import { Typo } from "../../../constants/typography";
import { useNotificationsNonLues } from "../../../hooks/useNotificationsNonLues";
import { useProfilComplet } from "../../../hooks/useProfilComplet";
import { logout } from "../../../services/auth.service";
import { unsubscribe as seDesabonnerNotifsWeb } from "../../../services/notifications/webPush";
import { removeToken } from "../../../stores/auth.store";
import { formaterDateHeureLongue } from "../../../utils/dates";
import { CONTENU_MARGE_BASSE } from "../_layout";
import { useDialogue } from "../../../components/DialogueProvider";

// 📖 Bannière aubergine pleine largeur, qui passe sous la barre d'état et
//    remplace l'en-tête (titre et cloche y restent). Une colline crème en arc
//    de cercle la grignote par le bas ; son sommet passe au milieu de l'avatar,
//    à cheval sur les deux fonds.
const MARGE_HAUT = 54; // = paddingTop du contenu : la bannière remonte d'autant
const MARGE_COTE = 18; // = paddingHorizontal du contenu
const SOMMET = MARGE_HAUT + 150; // hauteur du sommet de la colline = centre de l'avatar
const CREUX = 35; // de combien la colline redescend du centre jusqu'aux bords
const BANNIERE = SOMMET + CREUX + 35;
const AVATAR = 128;
const BOUTON_MODIFIER = 44;

export default function ProfilScreen() {
  const router = useRouter();
  const { confirmer } = useDialogue();
  const [modaleNiveau, setModaleNiveau] = useState(false);
  const notificationsNonLues = useNotificationsNonLues();
  const { apercu, profil, dons, badges, loading, error, reload } =
    useProfilComplet();

  // 📖 useFocusEffect (et pas useEffect) : l'écran Profil reste monté quand on
  //    ouvre "Informations personnelles". Au retour, on veut le pseudo/l'avatar
  //    à jour → on recharge à chaque fois que l'écran (re)prend le focus.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleLogout = async () => {
    const ok = await confirmer({
      titre: "Se déconnecter",
      message: "Veux-tu vraiment te déconnecter ?",
      libelleRester: "Non, je reste",
      libelleAction: "Me déconnecter",
    });
    if (!ok) return;

    try {
      // 📖 Avant logout() : le désabonnement appelle l'API avec le token
      //    encore valide. Après, l'appareil continuerait de recevoir les
      //    push de ce compte malgré la déconnexion.
      await seDesabonnerNotifsWeb();
    } catch {
      // 📖 Le désabonnement est une opération de confort : son échec ne
      //    doit pas empêcher la déconnexion.
    }
    try {
      await logout();
    } catch {
      // 📖 Même si l'appel /auth/logout échoue (réseau coupé), on purge
      //    le token local : l'utilisateur doit pouvoir se déconnecter.
    }
    await removeToken();
    router.replace("/auth/login");
  };

  // 📖 On peint dès qu'on a une info : le profil frais, sinon l'aperçu du cache.
  const pseudo = profil?.pseudo ?? apercu?.pseudo ?? "";
  const avatarId = profil?.avatar_id ?? apercu?.avatar_id ?? null;
  const points = profil?.points_cumules ?? apercu?.points_cumules ?? 0;

  const rienAAfficher = !profil && !apercu;

  // 📖 Barre d'état claire tant qu'elle est posée sur la bannière aubergine,
  //    sombre dès que le défilement la fait passer sur le fond crème. Rendue
  //    seulement quand l'écran a le focus : l'onglet reste monté en arrière-plan.
  const focalise = useIsFocused();
  const [surBanniere, setSurBanniere] = useState(true);

  // 📖 GET /dons renvoie les dons du plus récent au plus ancien.
  const dernierDon = dons?.dons[0]?.date_don;
  const sousTitreDons = dernierDon
    ? `Dernier : ${formaterDateHeureLongue(dernierDon)}`
    : "Tes dons et cartes-souvenirs";

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const dessus = e.nativeEvent.contentOffset.y < BANNIERE - MARGE_HAUT;
          if (dessus !== surBanniere) setSurBanniere(dessus);
        }}
      >
        {focalise && <StatusBar style={surBanniere ? "light" : "dark"} />}

        <View style={styles.banniereHaut}>
          <DecorsAvatar />
          <Text style={styles.titre} accessibilityRole="header" numberOfLines={1}>
            Profil
          </Text>
          <View style={styles.cloche}>
            <BoutonNotifications
              notificationsNonLues={notificationsNonLues}
              onPressNotifications={() => router.push('/notifications')}
            />
          </View>
        </View>

        {loading && rienAAfficher && <Chargement message="On récupère ton profil…" />}

        {error && rienAAfficher && (
          <EtatErreur
            titre="Ton profil fait une pause"
            message="Vérifie ton réseau puis réessaie. Tes points et tes badges restent bien au chaud."
            onReessayer={reload}
          />
        )}

        {!rienAAfficher && (
          <>
            {/* IDENTITÉ — avatar posé sur le sommet de la colline */}
            <View style={styles.hero}>
              <Animated.View entering={ZoomIn.springify().damping(16).stiffness(250)}>
                {/* 📖 Surélevé = interactif : l'avatar entier ouvre « Mes informations »,
                    le crayon signale qu'on peut le toucher. Une seule cible, un seul libellé. */}
                <Pressable
                  onPress={() => router.push("/tabs/profil/informations")}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier mon profil"
                  style={({ pressed }) => pressed && styles.avatarPresse}
                >
                  {/* 📖 L'ombre sur une vue à part : Avatar découpe son cercle
                      (overflow: hidden), ce qui rognerait l'ombre sur iOS. */}
                  <View style={styles.avatarOmbre}>
                    <Avatar avatarId={avatarId} pseudo={pseudo} taille={AVATAR} style={styles.avatar} />
                  </View>

                  <View style={styles.modifier}>
                    <Ionicons name="pencil" size={18} color={Theme.action.primaireTexte} />
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            <Animated.View style={styles.identite} entering={entree(1)}>
              <Text style={[Typo.titre1, styles.pseudo]} accessibilityRole="header" numberOfLines={1}>
                {pseudo}
              </Text>
              {/* 📖 Même aplat lime + étoile que la pastille de points de l'en-tête :
                  les deux ouvrent la même modale de progression. */}
              {profil && (
                <Pressable
                  style={({ pressed }) => [styles.niveau, pressed && styles.niveauPresse]}
                  onPress={() => setModaleNiveau(true)}
                  hitSlop={Espace[2]}
                  accessibilityRole="button"
                  accessibilityLabel={`Niveau ${profil.niveau.niveau}, ${profil.niveau.label}`}
                  accessibilityHint="Affiche ta progression et comment gagner des points"
                >
                  <Ionicons name="star" size={14} color={Theme.accent.signatureTexte} />
                  <Text style={[Typo.legendeForte, { color: Theme.accent.signatureTexte }]}>
                    Niv. {profil.niveau.niveau} · {profil.niveau.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={Theme.accent.signatureTexte} />
                </Pressable>
              )}
            </Animated.View>

            {profil && (
              <NiveauModal
                visible={modaleNiveau}
                onClose={() => setModaleNiveau(false)}
                profil={profil}
              />
            )}

            {/* CHIFFRES CLÉS — cartes flottantes, légèrement inclinées */}
            <View style={styles.chiffres}>
              <CarteChiffre
                rang={2}
                icone="water-outline"
                teinte="corail"
                inclinaison="-3deg"
                valeur={dons ? String(dons.total_dons) : "–"}
                libelle={accorder(dons?.total_dons ?? 0, "Don")}
              />
              <CarteChiffre
                rang={3}
                icone="star-outline"
                teinte="petrole"
                inclinaison="2deg"
                valeur={String(points)}
                libelle={accorder(points, "Point")}
              />
              <CarteChiffre
                rang={4}
                icone="ribbon-outline"
                teinte="mousse"
                inclinaison="-2deg"
                valeur={badges ? `${badges.obtenus}/${badges.total}` : "–"}
                libelle="Badges"
              />
            </View>

            {/* MON ACTIVITÉ */}
            <Animated.View entering={entree(5)}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Mon activité
              </Text>
              {/* 📖 Pas de compteur ici : dons, points et badges sont déjà dans les
                  cartes juste au-dessus. Les sous-titres disent autre chose. */}
              <Groupe>
                <ElementListe
                  icone="water-outline"
                  teinte="corail"
                  titre="Historique des dons"
                  sousTitre={dons ? sousTitreDons : undefined}
                  onPress={() => router.push("/tabs/profil/historique-dons")}
                />
                <Separateur />
                <ElementListe
                  icone="ribbon-outline"
                  teinte="mousse"
                  titre="Mes badges"
                  sousTitre="Ta collection et ceux à débloquer"
                  onPress={() => router.push("/tabs/profil/badges")}
                />
                <Separateur />
                <ElementListe
                  icone="star-outline"
                  teinte="petrole"
                  titre="Points et niveau"
                  sousTitre="Comment progresser"
                  onPress={() => router.push("/tabs/profil/points")}
                />
                <Separateur />
                <ElementListe
                  icone="people-outline"
                  teinte="orange"
                  titre="Parrainage"
                  sousTitre={profil ? compter(profil.nb_parrainages_valides, "filleul") : undefined}
                  onPress={() => router.push("/tabs/profil/parrainage")}
                />
              </Groupe>
            </Animated.View>

            {/* PARAMÈTRES */}
            <Animated.View entering={entree(6)}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Paramètres
              </Text>
              <Groupe>
                {/* 📖 Une seule entrée : les notifications se règlent dans les Paramètres.
                    Deux lignes vers la même page laissaient croire à deux écrans distincts. */}
                <ElementListe
                  icone="settings-outline"
                  titre="Paramètres du compte"
                  sousTitre="Compte, notifications, confidentialité"
                  onPress={() => router.push("/tabs/profil/parametres")}
                />
              </Groupe>
            </Animated.View>

            <Animated.View entering={entree(7)}>
              <Bouton
                variante="sortie"
                libelle="Se déconnecter"
                icone="log-out-outline"
                onPress={handleLogout}
                style={styles.deconnexion}
              />
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Pastilles décoratives de la bannière, animées en continu : chacune flotte
 * à son propre rythme (durées différentes, pour un mouvement qui ne se répète
 * pas à l'identique).
 * 📖 « Réduire les animations » activé (WCAG 2.3.3) : tout reste immobile.
 */
function DecorsAvatar() {
  const reduire = useReducedMotion();
  // 📖 Largeur réelle de la bannière (mesurée), la fenêtre en attendant la mesure.
  const { width: largeurFenetre } = useWindowDimensions();
  const [largeurMesuree, setLargeurMesuree] = useState<number | null>(null);
  const largeur = largeurMesuree ?? largeurFenetre;
  // 📖 Rayon du cercle qui passe par le sommet (au centre) et descend de CREUX
  //    pile aux deux bords : la courbe garde la même allure du petit téléphone
  //    à la tablette, au lieu de se creuser (ou de casser) sur un écran large.
  const rayon = (largeur * largeur) / (8 * CREUX) + CREUX / 2;
  const lent = useSharedValue(0);
  const rapide = useSharedValue(0);

  useEffect(() => {
    if (reduire) return;
    const vaEtVient = (duree: number) =>
      withRepeat(withTiming(1, { duration: duree, easing: Easing.inOut(Easing.sin) }), -1, true);
    lent.set(vaEtVient(3400));
    rapide.set(vaEtVient(2600));
    return () => {
      cancelAnimation(lent);
      cancelAnimation(rapide);
    };
  }, [reduire, lent, rapide]);

  const brique = useAnimatedStyle(() => ({
    transform: [{ translateY: -12 * rapide.get() }, { translateX: 5 * rapide.get() }],
  }));
  const lime = useAnimatedStyle(() => ({
    transform: [{ translateY: 10 * lent.get() }, { translateX: -8 * lent.get() }],
  }));
  // 📖 La colline monte et descend doucement autour du centre de l'avatar.
  const colline = useAnimatedStyle(() => ({
    transform: [{ translateY: 3 - 6 * lent.get() }],
  }));

  return (
    <Animated.View
      style={styles.decors}
      onLayout={(e) => setLargeurMesuree(e.nativeEvent.layout.width)}
      entering={FadeIn.duration(250)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.fondAubergine} />
      <Animated.View
        style={[
          styles.colline,
          { width: rayon * 2, height: rayon * 2, borderRadius: rayon, left: largeur / 2 - rayon },
          colline,
        ]}
      />
      <Animated.View style={[styles.point, styles.pointBrique, brique]} />
      <Animated.View style={[styles.point, styles.pointLime, lime]} />
    </Animated.View>
  );
}

const POINT_BRIQUE = 28;
const POINT_LIME = 20;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: CONTENU_MARGE_BASSE,
  },

  banniereHaut: {
    height: BANNIERE,
    marginTop: -MARGE_HAUT,
    marginHorizontal: -MARGE_COTE,
    alignItems: "center",
    // 📖 Rogne la colline, bien plus grande que la bannière.
    overflow: "hidden",
  },
  // 📖 Même place et même style que le titre de l'en-tête des autres onglets,
  //    en crème sur l'aubergine.
  titre: {
    position: "absolute",
    top: MARGE_HAUT,
    left: MARGE_COTE,
    right: MARGE_COTE + 56,
    lineHeight: 40,
    fontSize: 24,
    fontWeight: "700",
    color: Theme.texte.surAccent,
  },
  // 📖 L'aubergine s'arrête 2 px avant le bas de la bannière : sinon son bord
  //    transparaît sous celui de la colline (anticrénelage) et trace une ligne.
  fondAubergine: {
    ...StyleSheet.absoluteFill,
    bottom: 2,
    backgroundColor: Theme.texte.principal,
  },
  // 📖 Cercle bien plus large que l'écran (taille calculée selon la largeur) :
  //    seul le haut de son arc se voit.
  colline: {
    position: "absolute",
    top: SOMMET,
    backgroundColor: Theme.fond.page,
  },
  // 📖 Même place que la cloche de l'en-tête sur les autres onglets.
  cloche: {
    position: "absolute",
    top: MARGE_HAUT,
    right: MARGE_COTE,
  },
  // 📖 Centre de l'avatar sur le sommet de la colline.
  hero: {
    alignItems: "center",
    marginTop: SOMMET - BANNIERE - AVATAR / 2,
    marginBottom: Espace[4],
  },
  decors: {
    ...StyleSheet.absoluteFill,
  },
  point: {
    position: "absolute",
  },
  pointBrique: {
    width: POINT_BRIQUE,
    height: POINT_BRIQUE,
    borderRadius: POINT_BRIQUE / 2,
    backgroundColor: Palette.corail[500],
    top: MARGE_HAUT + 80,
    left: "16%",
  },
  pointLime: {
    width: POINT_LIME,
    height: POINT_LIME,
    borderRadius: POINT_LIME / 2,
    backgroundColor: Theme.accent.signatureAplat,
    top: MARGE_HAUT + Espace[2],
    right: "32%",
  },
  avatarOmbre: {
    borderRadius: AVATAR / 2,
    ...Ombre.flottante,
  },
  avatar: {
    borderWidth: 4,
    borderColor: Theme.fond.surface,
    backgroundColor: Theme.fond.surface,
  },
  // 📖 Posé sur le bord de l'avatar ; le contour couleur de surface le détache.
  modifier: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: BOUTON_MODIFIER,
    height: BOUTON_MODIFIER,
    borderRadius: BOUTON_MODIFIER / 2,
    backgroundColor: Theme.action.primaire,
    borderWidth: 3,
    borderColor: Theme.fond.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPresse: {
    opacity: 0.85,
  },

  identite: {
    alignItems: "center",
    gap: Espace[2],
  },
  pseudo: {
    color: Theme.texte.principal,
    textAlign: "center",
  },
  niveau: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espace[1],
    minHeight: 34,
    marginVertical: Espace[2],
    paddingHorizontal: Espace[4],
    borderRadius: Rayon.plein,
    backgroundColor: Theme.accent.signatureAplat,
    // 📖 Ouvre la modale de progression : surélevée, comme tout ce qui se touche.
    ...Ombre.flottante,
  },
  niveauPresse: {
    opacity: 0.8,
  },

  chiffres: {
    flexDirection: "row",
    gap: Espace[3],
    marginTop: Espace[6],
    marginBottom: Espace[2],
  },

  sectionTitre: {
    color: Theme.texte.principal,
    marginTop: Espace[6],
    marginBottom: Espace[3],
  },

  deconnexion: {
    marginTop: Espace[8],
  },
});
