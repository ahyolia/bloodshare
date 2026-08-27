import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { getToken } from '../stores/auth.store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const inAuthGroup = segments[0] === 'auth';
  const inTabsGroup = segments[0] === 'tabs';

  useEffect(() => {
    // Attendre que la navigation soit prête
    if (!navigationState?.key) return;

    let cancelled = false;

    // 📖 On relit le token à chaque changement de groupe de routes plutôt que de le garder
    // dans un state : sinon, après un login, ce composant garderait l'ancienne valeur (null)
    // et renverrait aussitôt l'utilisateur sur /auth/login.
    getToken().then((token) => {
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
  }, [inAuthGroup, inTabsGroup, navigationState?.key]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
