export type BlocDocument =
  | { type: 'titre'; texte: string }
  | { type: 'paragraphe'; texte: string }
  | { type: 'liste'; items: string[] };

/** Morceau de texte, en gras ou non. */
export type SegmentTexte = { texte: string; gras: boolean };

/**
 * Découpe un paragraphe ou une puce selon le gras « **…** ».
 *
 * 📖 Une étoile double sans sa fermante reste du texte normal : une coquille dans le
 *    backoffice ne met jamais toute la fin du document en gras.
 */
export const decouperGras = (texte: string): SegmentTexte[] => {
  const segments: SegmentTexte[] = [];
  const motif = /\*\*(.+?)\*\*/g;
  let debut = 0;

  for (const correspondance of texte.matchAll(motif)) {
    const index = correspondance.index ?? 0;
    if (index > debut) segments.push({ texte: texte.slice(debut, index), gras: false });
    segments.push({ texte: correspondance[1], gras: true });
    debut = index + correspondance[0].length;
  }
  if (debut < texte.length) segments.push({ texte: texte.slice(debut), gras: false });

  return segments;
};

/**
 * Découpe le texte d'un document juridique saisi dans le backoffice en blocs à afficher.
 *
 * 📖 Syntaxe volontairement minimale (rappelée dans le BO, DocumentJuridiqueResource) :
 *    « ## Titre » pour un titre, « - » en début de ligne pour une puce, une ligne vide
 *    entre deux paragraphes, « **texte** » pour du gras (voir `decouperGras`). Pas de
 *    bibliothèque Markdown : rien d'autre n'est interprété, et un texte mal formé
 *    s'affiche simplement comme un paragraphe.
 */
export const decouperDocument = (contenu: string): BlocDocument[] => {
  const blocs: BlocDocument[] = [];
  let paragraphe: string[] = [];
  let liste: string[] = [];

  const fermerParagraphe = () => {
    if (paragraphe.length) blocs.push({ type: 'paragraphe', texte: paragraphe.join(' ') });
    paragraphe = [];
  };
  const fermerListe = () => {
    if (liste.length) blocs.push({ type: 'liste', items: liste });
    liste = [];
  };

  for (const ligneBrute of contenu.replace(/\r\n/g, '\n').split('\n')) {
    const ligne = ligneBrute.trim();

    if (!ligne) {
      fermerParagraphe();
      fermerListe();
    } else if (/^#{1,6}\s+/.test(ligne)) {
      fermerParagraphe();
      fermerListe();
      blocs.push({ type: 'titre', texte: ligne.replace(/^#{1,6}\s+/, '') });
    } else if (/^[-*]\s+/.test(ligne)) {
      fermerParagraphe();
      liste.push(ligne.replace(/^[-*]\s+/, ''));
    } else {
      fermerListe();
      paragraphe.push(ligne);
    }
  }

  fermerParagraphe();
  fermerListe();

  return blocs;
};
