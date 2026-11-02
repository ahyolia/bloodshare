import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Vrai si « Réduire les animations » est activé sur l'appareil, `null` tant qu'on ne
 * le sait pas encore (lecture asynchrone).
 *
 * 📖 Les animations d'entrée de Reanimated (FadeIn, ZoomIn…) s'en chargent seules. Ce
 *    hook sert aux animations qu'on lance nous-mêmes : boucles, compteurs, confettis.
 */
export function useReduireAnimations(): boolean | null {
  const [reduire, setReduire] = useState<boolean | null>(null);

  useEffect(() => {
    let actif = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((valeur) => actif && setReduire(valeur))
      .catch(() => actif && setReduire(false));

    // Réglage changé pendant que l'écran est ouvert : on suit.
    const abonnement = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduire);

    return () => {
      actif = false;
      abonnement?.remove();
    };
  }, []);

  return reduire;
}
