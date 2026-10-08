import { useEffect } from "react";
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import { getToken, getUser } from "../stores/auth.store";
import { DialogueProvider } from "../components/DialogueProvider";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

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

        if (!token && !inAuthGroup) {
          router.replace("/auth/login");
          return;
        }

        if (token) {
          // 📖 Un mdp réinitialisé par un admin (voir UserResource) oblige l'utilisateur à
          //    en choisir un nouveau avant d'accéder au reste de l'app, où qu'il navigue.
          const user = await getUser().catch(() => null);
          if (user?.doit_changer_mdp && !inChangerMdpGroup) {
            router.replace("/changer-mot-de-passe?force=1");
            return;
          }

          if (!inTabsGroup) {
            // 📖 `!inTabsGroup` et non `inAuthGroup` : au lancement on est sur `app/index.tsx`
            // (ni `auth`, ni `tabs`). Avec `inAuthGroup`, aucune des deux branches ne se
            // déclenchait et l'utilisateur connecté restait bloqué sur l'écran de chargement.
            router.replace("/tabs");
          }
        }
      });

    return () => {
      cancelled = true;
    };
    // 📖 On dépend de booléens et non de `segments` : useSegments() renvoie un nouveau
    // tableau à chaque rendu, ce qui redéclencherait cet effet en boucle.
  }, [inAuthGroup, inChangerMdpGroup, inTabsGroup, navigationState?.key, router]);

  return (
    <DialogueProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DialogueProvider>
  );
}
