import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { getToken } from '../stores/auth.store';

export default function RootLayout() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)');
    }
    setChecked(true);
  };

  if (!checked) return null;
  return <Slot />;
}
