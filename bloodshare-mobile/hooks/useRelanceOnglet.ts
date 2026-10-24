import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

type Navigation = NavigationProp<ParamListBase>;

// Remonte jusqu'au navigateur d'onglets (l'écran peut être dans la pile d'un onglet).
const navigateurOnglets = (navigation: Navigation | undefined): Navigation | undefined => {
  let courant = navigation;
  while (courant && courant.getState()?.type !== 'tab') {
    courant = courant.getParent();
  }
  return courant;
};

/**
 * Clé qui change à chaque appui sur l'onglet `onglet` de la barre de navigation.
 *
 * 📖 À poser en `key` sur le ScrollView principal de l'écran : il est recréé, donc on
 *    repart du haut de la page et les animations d'entrée (`entering`) se rejouent,
 *    sans recharger les données (les hooks de l'écran, au-dessus, ne bougent pas).
 *    Seul l'appui sur l'onglet compte : revenir d'une sous-page garde la position.
 */
export function useRelanceOnglet(onglet: string): number {
  const navigation = useNavigation<Navigation>();
  const [cle, setCle] = useState(0);

  useEffect(() => {
    const onglets = navigateurOnglets(navigation);
    if (!onglets) return;

    // `tabPress` n'est pas dans le type générique de useNavigation : on passe par `as never`.
    return onglets.addListener('tabPress' as never, (evenement: { target?: string }) => {
      const route = onglets.getState()?.routes.find((r) => r.key === evenement.target);
      if (route?.name === onglet) setCle((c) => c + 1);
    });
  }, [navigation, onglet]);

  return cle;
}
