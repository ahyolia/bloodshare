import type { NiveauStock, StockGroupe } from '../services/stockSang.service';
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

// 📖 Les heures des événements s'affichent telles qu'enregistrées (lues en UTC), comme
//    sur la page détail : « 09:00Z » s'affiche « 09h00 » quel que soit le fuseau.
const heure = (iso: string) => {
  const date = new Date(iso);
  return `${deuxChiffres(date.getUTCHours())}h${deuxChiffres(date.getUTCMinutes())}`;
};

/** Jour et mois de la pastille calendrier : { jour: '08', mois: 'OCT', moisLong: 'octobre' }. */
export function dateEvenement(iso: string) {
  const date = new Date(iso);
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
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const jour = date.getUTCDate();
  return `${JOURS[date.getUTCDay()]} ${jour === 1 ? '1er' : jour} ${getNomMois(date.getUTCMonth() + 1).toLowerCase()} ${date.getUTCFullYear()}`;
}

/** Date de publication d'une actualité, avec l'année : « 28 août 2026 ». */
export function dateActualiteLongue(iso: string): string {
  const morceaux = /^(\d{4})-\d{2}-\d{2}/.exec(iso);
  const courte = dateActualite(iso);
  return morceaux && courte !== iso ? `${courte} ${morceaux[1]}` : iso;
}

/** « 09h00 → 17h00 », ou « 09h00 » sans heure de fin. */
export const horaireEvenement = (debut: string, fin?: string | null): string =>
  fin ? `${heure(debut)} → ${heure(fin)}` : heure(debut);

/**
 * « Aujourd'hui », « Demain », « Dans 3 jours »… pour un événement de la semaine à venir,
 * `null` au-delà. Compté en jours du calendrier, pas en tranches de 24 h.
 */
export function etiquetteProchainement(iso: string, maintenant: Date = new Date()): string | null {
  const date = new Date(iso);
  const jourEvenement = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const aujourdHui = Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const jours = Math.round((jourEvenement - aujourdHui) / 86_400_000);

  if (jours < 0 || jours > 7) return null;
  if (jours === 0) return 'Aujourd’hui';
  if (jours === 1) return 'Demain';
  return `Dans ${jours} jours`;
}

/**
 * Date de publication d'une actualité : « 2026-08-28 » → « 28 août ».
 * 📖 Découpée à la main, sans `new Date`, pour qu'aucun fuseau ne décale le jour
 *    (voir `formaterDateLongue`). Format inattendu → renvoyée telle quelle.
 */
export function dateActualite(iso: string): string {
  const morceaux = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const nomMois = morceaux ? getNomMois(Number(morceaux[2])) : '';
  if (!morceaux || !nomMois) return iso;

  const jour = Number(morceaux[3]);
  return `${jour === 1 ? '1er' : jour} ${nomMois.toLowerCase()}`;
}
