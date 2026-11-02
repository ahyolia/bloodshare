/**
 * Sépare le contexte d'une question de la question elle-même, pour l'afficher en deux
 * temps : le contexte en texte courant, la question en titre.
 *
 * « Ton retour d'un voyage […] date d'il y a 3 mois. Peux-tu donner ton sang
 * aujourd'hui ? » → contexte « Ton retour […] 3 mois. », question « Peux-tu donner
 * ton sang aujourd'hui ? ».
 *
 * 📖 On ne coupe que si l'intitulé finit par une question et qu'une phrase la précède :
 *    une question courte, ou une affirmation « vrai ou faux », reste entière.
 */
export const decouperIntitule = (intitule: string): { contexte: string | null; question: string } => {
  const texte = intitule.trim();
  if (!texte.endsWith('?')) return { contexte: null, question: texte };

  // Dernière fin de phrase (. ! ou …) suivie d'un espace, avant la question finale.
  const fin = Math.max(
    texte.lastIndexOf('. '),
    texte.lastIndexOf('! '),
    texte.lastIndexOf('… ')
  );
  if (fin <= 0) return { contexte: null, question: texte };

  return {
    contexte: texte.slice(0, fin + 1).trim(),
    question: texte.slice(fin + 2).trim(),
  };
};
