import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { getToken } from '../stores/auth.store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  // TEMP TEST — pages auth pas encore créées, on ne redirige qu'une seule fois vers /tabs/don au lancement, à retirer avant commit
  const hasRedirected = useRef(false);

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  useEffect(() => {
    // Attendre que la navigation soit prête et le token chargé
    if (!navigationState?.key || token === undefined) return;

    // TEMP TEST — bypass auth : redirection unique vers /tabs/don, sans dépendre de `segments`
    // → sinon ce useEffect se redéclenche à CHAQUE navigation (segments change) et ramène en boucle sur /tabs/don
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/tabs/don');
    }

    // const inAuthGroup = segments[0] === 'auth';
    // if (!token && !inAuthGroup) {
    //   router.replace('/auth/login');
    // } else if (token && inAuthGroup) {
    //   router.replace('/tabs');
    // }
  }, [token, navigationState?.key]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
