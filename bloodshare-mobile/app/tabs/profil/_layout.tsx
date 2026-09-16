import { Stack } from 'expo-router';

// 📖 Toutes les sous-pages du profil partagent le même Stack sans header natif :
//    chaque écran dessine son propre "← Retour". On les déclare explicitement
//    surtout pour fixer l'ordre et permettre, plus tard, des options par écran.
export default function ProfilLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="informations" />
      <Stack.Screen name="historique-dons" />
      <Stack.Screen name="points" />
      <Stack.Screen name="parrainage" />
      <Stack.Screen name="parametres" />
    </Stack>
  );
}
