/**
 * Règle des mots de passe, identique à celle du backend
 * (PasswordRule::min(8)->mixedCase()->numbers()) : vérifiée côté app pour
 * prévenir l'utilisateur avant l'envoi, toujours revérifiée par l'API.
 */
export const REGLE_MOT_DE_PASSE = '8 caractères minimum, avec au moins une majuscule, une minuscule et un chiffre.';

export const motDePasseValide = (motDePasse: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(motDePasse);
