import { useEffect, useState } from 'react';
import { useReduireAnimations } from './useReduireAnimations';

/**
 * Fait monter un nombre de 0 jusqu'à `cible` (ex. le score sur l'écran de fin), en
 * ralentissant sur la fin. Affiche directement la valeur finale si « Réduire les
 * animations » est activé.
 *
 * 📖 La valeur animée sert à l'affichage seulement : le libellé lu par les lecteurs
 *    d'écran doit utiliser `cible`, sinon il annoncerait un chiffre intermédiaire.
 */
export function useCompteur(cible: number, duree = 900, delai = 0): number {
  const reduire = useReduireAnimations();
  const animer = reduire === false && cible > 0;
  const [valeur, setValeur] = useState(0);

  useEffect(() => {
    if (!animer) return;

    let image = 0;
    const minuteur = setTimeout(() => {
      const debut = Date.now();
      const avancer = () => {
        const t = Math.min((Date.now() - debut) / duree, 1);
        // Ralentit sur la fin (ease-out cubique) : le dernier chiffre « se pose ».
        setValeur(Math.round(cible * (1 - (1 - t) ** 3)));
        if (t < 1) image = requestAnimationFrame(avancer);
      };
      image = requestAnimationFrame(avancer);
    }, delai);

    return () => {
      clearTimeout(minuteur);
      cancelAnimationFrame(image);
    };
  }, [animer, cible, duree, delai]);

  // Réglage pas encore lu : 0, le compteur partira de là. Pas d'animation : la valeur finale.
  if (reduire === null) return 0;
  return animer ? valeur : cible;
}
