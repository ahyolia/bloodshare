import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { getToken } from '../stores/auth.store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  useEffect(() => {
    // Attendre que la navigation soit prête et le token chargé
    if (!navigationState?.key || token === undefined) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!token && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (token && inAuthGroup) {
      router.replace('/tabs');
    }
  }, [token, segments, navigationState?.key]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
