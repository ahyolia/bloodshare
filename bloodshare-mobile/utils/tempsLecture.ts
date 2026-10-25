// Vitesse de lecture d'un texte simple sur écran, en mots par minute.
const MOTS_PAR_MINUTE = 200;

/**
 * Temps de lecture d'un texte, en minutes entières (1 minimum).
 *
 * 📖 Les marques de mise en forme (« ## », « - », « ** ») ne comptent pas comme des mots.
 */
export const tempsLecture = (texte: string): number => {
  const mots = texte
    .replace(/[#*]/g, ' ')
    .split(/\s+/)
    .filter((mot) => /[\p{L}\p{N}]/u.test(mot)).length;

  return Math.max(1, Math.round(mots / MOTS_PAR_MINUTE));
};
