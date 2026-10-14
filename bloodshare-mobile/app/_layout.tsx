import { useEffect } from "react";
import { useFonts } from "expo-font";
import {
  Stack,
  usePathname,
  useRouter,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import { getToken, getUser } from "../stores/auth.store";
import { DialogueProvider } from "../components/DialogueProvider";
import { choisirDestination } from "../utils/destination";
import { getOnboardingVu } from "../utils/preferences";

/** Durée minimale d'affichage du splash au lancement (critère du ticket FO-03). */
const DUREE_MIN_SPLASH_MS = 1500;

/**
 * 📖 Instant d'ouverture de l'app. Mesuré au chargement du fichier, qui n'a lieu
 *    qu'une fois, et non pendant le rendu : un composant React doit rester pur
 *    (règle react-hooks/purity), et `Date.now()` change à chaque appel.
 */
const DEBUT_LANCEMENT = Date.now();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // 📖 Toutes les polices sont des COPIES placées dans `assets/fonts/` : Netlify
  //    écarte les fichiers rangés sous `node_modules`, donc une police chargée
  //    depuis un paquet n'arriverait jamais sur la PWA (carrés ou police système).
  //    ⚠️ Ionicons : à recopier depuis node_modules si @expo/vector-icons change
  //    de version (montée de SDK Expo), voir assets/fonts/__tests__.
  // 📖 Une famille par graisse (NunitoSans-Regular / -Bold) : sur Android,
  //    `fontWeight` ne sait pas choisir un autre fichier de police.
  const [policesChargees, erreurPolices] = useFonts({
    ionicons: require("../assets/fonts/Ionicons.ttf"),
    "NunitoSans-Regular": require("../assets/fonts/NunitoSans-Regular.ttf"),
    "NunitoSans-Bold": require("../assets/fonts/NunitoSans-Bold.ttf"),
    "Pacifico-Regular": require("../assets/fonts/Pacifico-Regular.ttf"),
  });

  const inAuthGroup = segments[0] === "auth";
  const inChangerMdpGroup = segments[0] === "changer-mot-de-passe";
  const inPublicGroup = segments[0] === "documents";
  // 📖 `detail` et `notifications` = écrans ouverts par-dessus les onglets : pour le
  //    garde ci-dessous, c'est de la zone connectée au même titre que `tabs`. Sans ça,
  //    l'ouverture d'un de ces écrans renverrait aussitôt l'utilisateur sur /tabs.
  const inTabsGroup =
    segments[0] === "tabs" ||
    segments[0] === "detail" ||
    segments[0] === "notifications" ||
    inChangerMdpGroup;
    
  // 📖 Au lancement, on est sur `app/index.tsx` (le splash), dont le chemin est "/".
  //    On teste le chemin et non `segments` : avec les routes typées, useSegments()
  //    ne prévoit pas de tableau vide, ce qui rendrait la condition fragile.
  const surSplash = usePathname() === "/";

  useEffect(() => {
    // Attendre que la navigation soit prête
    if (!navigationState?.key) return;

    let cancelled = false;

    // 📖 On relit le token à chaque changement de groupe de routes plutôt que de le garder
    // dans un state : sinon, après un login, ce composant garderait l'ancienne valeur (null)
    // et renverrait aussitôt l'utilisateur sur /auth/login.
    getToken()
      // 📖 Si la lecture du token échoue (stockage indisponible, module natif absent sur
      //    web…), on traite l'échec comme « pas de token » : l'utilisateur est renvoyé
      //    vers le login au lieu de rester bloqué sur l'écran de chargement.
      .catch((error) => {
        if (__DEV__)
          console.warn("[auth] lecture du token impossible :", error);
        return null;
      })
      .then(async (token) => {
        if (cancelled) return;

        // 📖 On ne lit que ce qui sert à la décision : l'onboarding pour un visiteur,
        //    le profil pour un utilisateur connecté.
        //    Si la lecture de l'onboarding échoue, on fait comme s'il était déjà vu :
        //    mieux vaut le manquer que rester bloqué sur le splash.
        const onboardingVu =
          token || inAuthGroup ? true : await getOnboardingVu().catch(() => true);
        const user = token ? await getUser().catch(() => null) : null;
        if (cancelled) return;

        const destination = choisirDestination({
          token,
          onboardingVu,
          doitChangerMdp: user?.doit_changer_mdp ?? false,
          inAuthGroup,
          inTabsGroup,
          inChangerMdpGroup,
          inPublicGroup,
        });
        if (!destination) return;

        // 📖 Seul le départ du splash est retardé, pour qu'il reste visible au moins
        //    DUREE_MIN_SPLASH_MS. Toutes les autres redirections restent immédiates.
        if (surSplash) {
          const restant = DUREE_MIN_SPLASH_MS - (Date.now() - DEBUT_LANCEMENT);
          if (restant > 0) {
            await new Promise((resolve) => setTimeout(resolve, restant));
          }
          // 📖 Pendant l'attente, l'effet a pu être relancé (navigation, login…) :
          //    on ne redirige pas avec une décision devenue périmée.
          if (cancelled) return;
        }

        router.replace(destination);
      });

    return () => {
      cancelled = true;
    };
    // 📖 On dépend de booléens et non de `segments` : useSegments() renvoie un nouveau
    // tableau à chaque rendu, ce qui redéclencherait cet effet en boucle.
  }, [inAuthGroup, inChangerMdpGroup, inTabsGroup, inPublicGroup, surSplash, navigationState?.key, router]);

  // 📖 On attend la police avant d'afficher l'app, sinon les icônes clignoteraient
  //    en carrés le temps du chargement. En cas d'échec, on affiche quand même :
  //    mieux vaut des icônes manquantes qu'une app bloquée.
  if (!policesChargees && !erreurPolices) return null;

  return (
    <DialogueProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DialogueProvider>
  );
}
