/**
 * Règle du mot de passe, identique au back (Laravel :
 * Password::min(8)->mixedCase()->numbers(), inscription et changement de mot de passe).
 *
 * 📖 Mêmes classes Unicode que Laravel : \p{Lu} (majuscule), \p{Ll} (minuscule) et
 *    \p{N} (chiffre), et non [A-Z] / [a-z] / \d, limités à l'ASCII. Les lettres
 *    accentuées (« Ébène2026 ») comptent donc comme côté back, et l'app ne peut pas
 *    valider tous les critères puis recevoir un 422, ni l'inverse.
 * 📖 Longueur comptée en vrais caractères ([...texte]), comme Laravel : `.length`
 *    compterait un emoji pour deux.
 */
export type CritereMotDePasse = {
  id: 'longueur' | 'majuscule' | 'minuscule' | 'chiffre';
  libelle: string;
  valide: boolean;
};

export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

export function criteresMotDePasse(motDePasse: string): CritereMotDePasse[] {
  return [
    {
      id: 'longueur',
      libelle: `${LONGUEUR_MIN_MOT_DE_PASSE} caractères`,
      valide: [...motDePasse].length >= LONGUEUR_MIN_MOT_DE_PASSE,
    },
    { id: 'majuscule', libelle: '1 majuscule', valide: /\p{Lu}/u.test(motDePasse) },
    { id: 'minuscule', libelle: '1 minuscule', valide: /\p{Ll}/u.test(motDePasse) },
    { id: 'chiffre', libelle: '1 chiffre', valide: /\p{N}/u.test(motDePasse) },
  ];
}

export function estMotDePasseValide(motDePasse: string): boolean {
  return criteresMotDePasse(motDePasse).every((critere) => critere.valide);
}

// Règle en une phrase, pour les écrans qui n'affichent pas les critères un par un
// (inscription, changement de mot de passe). Toujours revérifiée par l'API.
export const REGLE_MOT_DE_PASSE =
  `${LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum, avec au moins une majuscule, une minuscule et un chiffre.`;
