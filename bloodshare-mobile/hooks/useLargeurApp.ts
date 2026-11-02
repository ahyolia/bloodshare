import { useWindowDimensions } from 'react-native';
import { LARGEUR_MAX_APP } from '../constants/spacing';

/**
 * Taille utile de l'app : la fenêtre, mais limitée en largeur à la colonne centrée
 * des grands écrans (voir app/_layout). À utiliser à la place de useWindowDimensions
 * pour dimensionner un élément : sinon, sur ordinateur, il serait calculé sur toute
 * la largeur de l'écran et déborderait de la colonne.
 */
export function useLargeurApp() {
  const { width, height } = useWindowDimensions();
  return { width: Math.min(width, LARGEUR_MAX_APP), height };
}
