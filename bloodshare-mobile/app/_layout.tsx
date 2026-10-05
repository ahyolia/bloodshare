import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { getToken } from '../stores/auth.store';
import { DialogueProvider } from '../components/DialogueProvider';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const inAuthGroup = segments[0] === 'auth';
  // 📖 `detail` = écrans ouverts par-dessus les onglets (actualité, événement) : pour le
  //    garde ci-dessous, c'est de la zone connectée au même titre que `tabs`. Sans ça,
  //    l'ouverture d'un détail renverrait aussitôt l'utilisateur sur /tabs.
  const inTabsGroup = segments[0] === 'tabs' || segments[0] === 'detail';

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
        if (__DEV__) console.warn('[auth] lecture du token impossible :', error);
        return null;
      })
      .then((token) => {
      if (cancelled) return;

      if (!token && !inAuthGroup) {
        router.replace('/auth/login');
      } else if (token && !inTabsGroup) {
        // 📖 `!inTabsGroup` et non `inAuthGroup` : au lancement on est sur `app/index.tsx`
        // (ni `auth`, ni `tabs`). Avec `inAuthGroup`, aucune des deux branches ne se
        // déclenchait et l'utilisateur connecté restait bloqué sur l'écran de chargement.
        router.replace('/tabs');
      }
    });

    return () => {
      cancelled = true;
    };
    // 📖 On dépend de booléens et non de `segments` : useSegments() renvoie un nouveau
    // tableau à chaque rendu, ce qui redéclencherait cet effet en boucle.
  }, [inAuthGroup, inTabsGroup, navigationState?.key, router]);

  return (
    <DialogueProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DialogueProvider>
  );
}
