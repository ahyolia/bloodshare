/**
 * Accord des mots avec un compteur : « 1 don », « 2 dons ».
 *
 * 📖 Règle française : le pluriel commence à 2. « 0 don », « 1 don », « 1,5 point »
 *    restent au singulier.
 * 📖 Par défaut, chaque mot prend un « s », sauf s'il finit déjà par s, x ou z
 *    (« quiz », « mois ») : « carte obtenue » → « cartes obtenues ». Pour un pluriel
 *    irrégulier (« niveau » → « niveaux »), on passe la forme plurielle.
 */
const pluraliserMot = (mot: string) => (/[sxz]$/i.test(mot) ? mot : `${mot}s`);

/** Le ou les mots accordés avec `n`, sans le nombre : accorder(2, 'Don') → « Dons ». */
export function accorder(n: number, singulier: string, pluriel?: string): string {
  if (Math.abs(n) < 2) return singulier;
  return pluriel ?? singulier.split(' ').map(pluraliserMot).join(' ');
}

/** Le nombre suivi des mots accordés : compter(2, 'carte obtenue') → « 2 cartes obtenues ». */
export function compter(n: number, singulier: string, pluriel?: string): string {
  return `${n} ${accorder(n, singulier, pluriel)}`;
}
