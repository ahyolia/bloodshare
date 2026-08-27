import { Stack } from 'expo-router';

export default function ProfilLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* C'est ici que l'on déclarera les futures sous-pages si on a besoin 
          d'options spécifiques pour elles (comme un header natif par exemple) */}
    </Stack>
  );
}