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