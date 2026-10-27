import { Stack } from 'expo-router';

export default function CartesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="collection/[annee]" />
      <Stack.Screen
        name="[id]"
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack>
  );
}
