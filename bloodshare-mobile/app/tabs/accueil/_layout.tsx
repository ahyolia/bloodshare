import { Stack } from 'expo-router';

// 📖 Pile de navigation des écrans secondaires ouverts depuis l'accueil
//    (ex. le détail d'un événement). Même schéma que don/, quiz/, cartes/.
export default function AccueilLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
