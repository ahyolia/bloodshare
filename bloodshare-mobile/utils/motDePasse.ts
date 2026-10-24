/**
 * Règle du mot de passe, identique au back (Laravel :
 * Password::min(8)->mixedCase()->numbers(), inscription et changement de mot de passe).
 *
 * 📖 Majuscule / minuscule détectées en comparant le texte à sa version
 *    transformée, et non avec [A-Z] / [a-z] : ces classes ignorent les lettres
 *    accentuées (É, À, Ç…), que Laravel accepte. Sans ça, « Ébène2026 » serait
 *    refusé par l'app mais accepté par le back.
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
    { id: 'majuscule', libelle: '1 majuscule', valide: motDePasse !== motDePasse.toLowerCase() },
    { id: 'minuscule', libelle: '1 minuscule', valide: motDePasse !== motDePasse.toUpperCase() },
    { id: 'chiffre', libelle: '1 chiffre', valide: /\d/.test(motDePasse) },
  ];
}

export function estMotDePasseValide(motDePasse: string): boolean {
  return criteresMotDePasse(motDePasse).every((critere) => critere.valide);
}

// Compatibilité avec les écrans de dev (register, changer-mot-de-passe) :
// même règle, une seule implémentation. Toujours revérifiée par l'API.
export const REGLE_MOT_DE_PASSE =
  `${LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum, avec au moins une majuscule, une minuscule et un chiffre.`;

export const motDePasseValide = estMotDePasseValide;
