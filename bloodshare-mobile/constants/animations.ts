import { FadeIn, FadeInDown } from 'react-native-reanimated';

/**
 * Animations d'arrivée sur un écran. Deux niveaux, pour que la hiérarchie se sente :
 *
 * - `entree(rang)` — PAGES PRINCIPALES (onglets, ex. Profil) : les blocs glissent
 *   vers le haut l'un après l'autre. `rang` = ordre d'apparition (0, 1, 2…), 35 ms
 *   d'écart, 250 ms par bloc : le dernier bloc arrive en moins d'une demi-seconde.
 * - `entreeSousPage` — SOUS-PAGES (Mes badges, Paramètres…) : tout le contenu apparaît
 *   d'un bloc, en fondu, sans mouvement. La navigation fait déjà glisser la sous-page
 *   depuis la droite ; une cascade en plus la ferait passer pour une page principale.
 *
 * 📖 Reanimated saute ces animations si « Réduire les animations » est activé.
 * 📖 Dans une longue liste, plafonner le rang (ex. `Math.min(i, 6)`) : sinon le
 *    20e élément attendrait 0,7 s avant d'apparaître.
 */
export const entree = (rang: number) => FadeInDown.delay(rang * 35).duration(250);

export const entreeSousPage = FadeIn.duration(200);
