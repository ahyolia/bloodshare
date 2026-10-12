import { useEffect, useRef } from "react";
import { getOnboardingVu } from "../utils/preferences";
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

const DUREE_MIN_SPLASH_MS = 1500;

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // 📖 Sur le web exporté, Netlify écarte les fichiers rangés sous `node_modules` :
  //    la police d'@expo/vector-icons n'était jamais servie (icônes en carrés vides).
  //    On charge donc une copie placée dans `assets/fonts/`, sous le même nom de
  //    famille (`ionicons`) : le composant <Ionicons> la voit déjà chargée et ne va
  //    plus chercher la sienne. ⚠️ À recopier depuis node_modules si
  //    @expo/vector-icons change de version (montée de SDK Expo).
  const [policesChargees, erreurPolices] = useFonts({
    ionicons: require("../assets/fonts/Ionicons.ttf"),
  });

  const inAuthGroup = segments[0] === "auth";
  const inChangerMdpGroup = segments[0] === "changer-mot-de-passe";
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

  // 📖 Instant d'ouverture de l'app. Un `useRef` ne change pas entre deux rendus :
  //    on mesure donc bien le temps écoulé depuis le tout premier affichage,
  //    chargement des polices compris.
  const debutLancement = useRef(Date.now());

  useEffect(() => {
    // Attendre que la navigation soit prête
    if (!navigationState?.key) return;

    let cancelled = false;

    /**
     * Décide où doit aller l'utilisateur, ou renvoie `null` s'il est déjà
     * au bon endroit.
     */
    const choisirDestination = async (token: string | null) => {
      if (!token) {
        if (inAuthGroup) return null;

        // 📖 Première ouverture sur cet appareil → onboarding, sinon connexion.
        //    Si la lecture échoue, on fait comme si l'onboarding était déjà vu :
        //    mieux vaut le manquer que rester bloqué sur le splash.
        const onboardingVu = await getOnboardingVu().catch(() => true);
        return onboardingVu ? "/auth/login" : "/auth/onboarding";
      }

      // 📖 Un mdp réinitialisé par un admin (voir UserResource) oblige l'utilisateur à
      //    en choisir un nouveau avant d'accéder au reste de l'app, où qu'il navigue.
      const user = await getUser().catch(() => null);
      if (user?.doit_changer_mdp && !inChangerMdpGroup) {
        return "/changer-mot-de-passe?force=1";
      }

      // 📖 `!inTabsGroup` et non `inAuthGroup` : au lancement on est sur `app/index.tsx`
      // (ni `auth`, ni `tabs`). Avec `inAuthGroup`, l'utilisateur connecté restait
      // bloqué sur l'écran de chargement.
      if (!inTabsGroup) return "/tabs";

      return null;
    };

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

        const destination = await choisirDestination(token);
        if (cancelled || !destination) return;

        // 📖 Seul le départ du splash est retardé, pour qu'il reste visible au moins
        //    DUREE_MIN_SPLASH_MS. Toutes les autres redirections restent immédiates.
        if (surSplash) {
          const restant = DUREE_MIN_SPLASH_MS - (Date.now() - debutLancement.current);
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
  }, [inAuthGroup, inChangerMdpGroup, inTabsGroup, surSplash, navigationState?.key, router]);

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
