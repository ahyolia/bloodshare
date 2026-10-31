import { getNomMois } from './mois';

/**
 * Transforme une date « AAAA-MM-JJ » en date lisible : "2026-12-29" → "29 décembre 2026".
 *
 * 📖 On découpe la chaîne nous-mêmes au lieu de passer par `new Date(...)` :
 *    `new Date("2026-12-29")` lit la date comme minuit UTC, puis l'affichage la
 *    convertit dans le fuseau du téléphone. Sur un appareil en fuseau négatif,
 *    on afficherait la veille (« 28 décembre »). Sans objet Date, aucun fuseau
 *    n'intervient.
 * 📖 Les noms de mois viennent de `utils/mois.ts` plutôt que de
 *    `toLocaleDateString('fr-FR')`, dont le résultat dépend du moteur JavaScript
 *    (navigateur, Hermes, Node) : on obtient le même texte sur web, en natif et
 *    dans Jest.
 * 📖 Si la chaîne n'a pas le format attendu, on la renvoie telle quelle : mieux
 *    vaut afficher la date brute que rien du tout ou faire planter l'écran.
 * 📖 Le jour n'est pas vérifié selon le mois (« 2026-02-30 » donne « 30 février ») :
 *    la date vient du back (`toDateString()`), donc d'une date réelle.
 */
export function formaterDateLongue(dateIso: string): string {
  const morceaux = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  if (!morceaux) return dateIso;

  const annee = Number(morceaux[1]);
  const mois = Number(morceaux[2]);
  const jour = Number(morceaux[3]);

  const nomMois = getNomMois(mois);
  if (!nomMois || jour < 1 || jour > 31) return dateIso;

  // 📖 En français, le premier jour du mois s'écrit « 1er » : « 1er janvier 2027 ».
  const jourAffiche = jour === 1 ? '1er' : String(jour);

  return `${jourAffiche} ${nomMois.toLowerCase()} ${annee}`;
}

/**
 * Date-heure de l'API (« 2026-05-10T09:00:00Z ») → « 10 mai 2026 ».
 *
 * 📖 Ici on passe par `new Date` : c'est un instant, il faut l'afficher dans le
 *    fuseau du téléphone (un don à 23 h à Nouméa est daté du jour local, pas de
 *    la veille en UTC). Les noms de mois restent ceux de `utils/mois.ts`, pour
 *    le même texte sur web, en natif et dans Jest.
 * 📖 Valeur illisible → renvoyée telle quelle, comme `formaterDateLongue`.
 */
export function formaterDateHeureLongue(dateHeureIso: string): string {
  const date = new Date(dateHeureIso);
  if (Number.isNaN(date.getTime())) return dateHeureIso;

  const jour = date.getDate();
  const jourAffiche = jour === 1 ? '1er' : String(jour);
  return `${jourAffiche} ${getNomMois(date.getMonth() + 1).toLowerCase()} ${date.getFullYear()}`;
}

/** Comme `formaterDateHeureLongue`, sans l'année : « 10 mai ». Pour les chiffres clés, où la place manque. */
export function formaterDateHeureCourte(dateHeureIso: string): string {
  const longue = formaterDateHeureLongue(dateHeureIso);
  return longue === dateHeureIso ? longue : longue.replace(/ \d{4}$/, '');
}
