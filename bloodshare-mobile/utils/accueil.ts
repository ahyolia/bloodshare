import type { NiveauStock, StockGroupe } from '../services/stockSang.service';
import { formaterDateLongue } from './dates';
import { getNomMois } from './mois';

/**
 * Textes et dates de la page Accueil.
 */

/** « O- » → « O− » : le vrai signe moins, plus lisible que le trait d'union. */
export const groupeAffiche = (groupe: string): string => groupe.replace('-', '−');

/** « O- » → « O négatif » : ce qu'entend un lecteur d'écran (« O moins » prête à confusion). */
export const groupeLu = (groupe: string): string =>
  groupe.replace('-', ' négatif').replace('+', ' positif');

// « O− », « O− et A+ », « O−, A+ et B− ».
const enumerer = (mots: string[]): string =>
  mots.length <= 1 ? mots.join('') : `${mots.slice(0, -1).join(', ')} et ${mots[mots.length - 1]}`;

/**
 * Phrase sous le titre du bandeau des réserves : le groupe qui manque le plus, d'abord.
 * 📖 Données globales du Centre de don : rien ne dépend du groupe du donneur (anonymat).
 */
export function resumeStocks(stocks: StockGroupe[]): string {
  const groupes = (niveau: NiveauStock) =>
    stocks.filter((s) => s.niveau === niveau).map((s) => groupeAffiche(s.groupe));

  const critiques = groupes('critique');
  if (critiques.length > 0) return `Besoin urgent en ${enumerer(critiques)}. Ton don compte !`;

  const bas = groupes('bas');
  if (bas.length > 0) return `Les réserves baissent en ${enumerer(bas)}.`;

  if (stocks.some((s) => s.niveau !== null)) return 'Les réserves tiennent bon, merci aux donneurs !';
  return 'Les niveaux ne sont pas encore communiqués.';
}

const MOIS_ABREGES = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEP', 'OCT', 'NOV', 'DÉC'];

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

// 📖 Nouméa est à UTC+11 toute l'année (pas d'heure d'été).
const DECALAGE_NOUMEA_MS = 11 * 3_600_000;

// 📖 L'API renvoie le vrai instant en UTC : un événement saisi à 13 h 30 dans le BO
//    (APP_TIMEZONE=Pacific/Noumea) arrive en « 02:30Z ». Les dates d'événement sont
//    donc décalées à l'heure de Nouméa, puis lues avec getUTC* : même affichage quel que
//    soit le fuseau du téléphone ou du navigateur. Avant, « 02:30Z » s'affichait « 02h30 ».
const enHeureDeNoumea = (iso: string) => new Date(new Date(iso).getTime() + DECALAGE_NOUMEA_MS);

const heure = (iso: string) => {
  const date = enHeureDeNoumea(iso);
  return `${deuxChiffres(date.getUTCHours())}h${deuxChiffres(date.getUTCMinutes())}`;
};

/** Jour et mois de la pastille calendrier : { jour: '08', mois: 'OCT', moisLong: 'octobre' }. */
export function dateEvenement(iso: string) {
  const date = enHeureDeNoumea(iso);
  return {
    jour: deuxChiffres(date.getUTCDate()),
    mois: MOIS_ABREGES[date.getUTCMonth()] ?? '',
    moisLong: getNomMois(date.getUTCMonth() + 1).toLowerCase(),
  };
}

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * « Samedi 20 septembre 2026 ». Écrit à la main (pas `toLocaleDateString`, qui dépend du
 * moteur JavaScript) : le même texte sur web, en natif et dans Jest.
 */
export function dateEvenementLongue(iso: string): string {
  const date = enHeureDeNoumea(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const jour = date.getUTCDate();
  return `${JOURS[date.getUTCDay()]} ${jour === 1 ? '1er' : jour} ${getNomMois(date.getUTCMonth() + 1).toLowerCase()} ${date.getUTCFullYear()}`;
}

/**
 * Date de publication d'une actualité, avec l'année : « 2026-08-28 » → « 28 août 2026 ».
 * 📖 Même formatage que le reste de l'app (`formaterDateLongue`), sur le seul jour : une
 *    date-heure (« 2026-08-28T10:00:00Z ») est acceptée aussi. Format inattendu →
 *    renvoyée telle quelle.
 */
export function dateActualiteLongue(iso: string): string {
  const jour = iso.slice(0, 10);
  const longue = formaterDateLongue(jour);
  return longue === jour ? iso : longue;
}

/** « 09h00 → 17h00 », ou « 09h00 » sans heure de fin. */
export const horaireEvenement = (debut: string, fin?: string | null): string =>
  fin ? `${heure(debut)} → ${heure(fin)}` : heure(debut);

/**
 * « Aujourd'hui », « Demain », « Dans 3 jours »… pour un événement de la semaine à venir,
 * `null` au-delà. Compté en jours du calendrier, pas en tranches de 24 h.
 *
 * 📖 Le jour de l'événement est celui de Nouméa (voir `enHeureDeNoumea`), celui
 *    d'aujourd'hui l'heure locale du téléphone.
 */
export function etiquetteProchainement(iso: string, maintenant: Date = new Date()): string | null {
  const date = enHeureDeNoumea(iso);
  const jourEvenement = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const aujourdHui = Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const jours = Math.round((jourEvenement - aujourdHui) / 86_400_000);

  if (jours < 0 || jours > 7) return null;
  if (jours === 0) return 'Aujourd’hui';
  if (jours === 1) return 'Demain';
  return `Dans ${jours} jours`;
}

/** Comme `dateActualiteLongue`, sans l'année : « 2026-08-28 » → « 28 août ». */
export function dateActualite(iso: string): string {
  const longue = dateActualiteLongue(iso);
  return longue === iso ? iso : longue.replace(/ \d{4}$/, '');
}

/**
 * Page affichée par les points d'un carrousel horizontal, d'après sa position de défilement.
 *
 * 📖 En fin de défilement, c'est toujours la dernière page : quand la zone visible est plus
 *    large qu'une page, le défilement s'arrête avant le point d'accroche de la dernière, et
 *    l'arrondi seul ne l'atteindrait jamais (son point ne s'allumerait pas).
 */
export function pageCarrousel(
  { decalage, largeurContenu, largeurVisible }: { decalage: number; largeurContenu: number; largeurVisible: number },
  largeurPage: number,
  nbPages: number
): number {
  if (nbPages <= 1 || largeurPage <= 0) return 0;
  if (decalage >= largeurContenu - largeurVisible - 1) return nbPages - 1;
  return Math.max(0, Math.min(Math.round(decalage / largeurPage), nbPages - 1));
}
