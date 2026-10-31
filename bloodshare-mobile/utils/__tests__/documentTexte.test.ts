import { decouperDocument, decouperGras } from '../documentTexte';

describe('decouperDocument', () => {
  it('reconnaît les titres, les paragraphes et les listes', () => {
    const texte = [
      '## Objet',
      '',
      "Aïma est éditée par l'ADSB-NC.",
      '',
      '## Accès',
      '- Réservée aux majeurs',
      '- Gratuite',
    ].join('\n');

    expect(decouperDocument(texte)).toEqual([
      { type: 'titre', texte: 'Objet' },
      { type: 'paragraphe', texte: "Aïma est éditée par l'ADSB-NC." },
      { type: 'titre', texte: 'Accès' },
      { type: 'liste', items: ['Réservée aux majeurs', 'Gratuite'] },
    ]);
  });

  it('réunit en un seul paragraphe les lignes qui se suivent', () => {
    expect(decouperDocument('Première ligne\nseconde ligne')).toEqual([
      { type: 'paragraphe', texte: 'Première ligne seconde ligne' },
    ]);
  });

  it('accepte les fins de ligne Windows saisies dans le backoffice', () => {
    expect(decouperDocument('## Titre\r\n\r\nTexte')).toEqual([
      { type: 'titre', texte: 'Titre' },
      { type: 'paragraphe', texte: 'Texte' },
    ]);
  });

  it('ferme la liste quand un paragraphe la suit sans ligne vide', () => {
    expect(decouperDocument('- un\n- deux\nSuite')).toEqual([
      { type: 'liste', items: ['un', 'deux'] },
      { type: 'paragraphe', texte: 'Suite' },
    ]);
  });

  it("garde le HTML et les liens comme du texte, sans rien interpréter", () => {
    // 📖 Audit cybersécurité : le texte vient du BO, il ne doit jamais devenir du code ou un lien.
    const piege = '<script>alert(1)</script> [clic](javascript:alert(1))';

    expect(decouperDocument(piege)).toEqual([{ type: 'paragraphe', texte: piege }]);
  });

  it('renvoie une liste vide pour un texte vide', () => {
    expect(decouperDocument('  \n ')).toEqual([]);
  });
});

describe('decouperGras', () => {
  it('isole les passages en gras', () => {
    expect(decouperGras('Un don ne rapporte **jamais** de points.')).toEqual([
      { texte: 'Un don ne rapporte ', gras: false },
      { texte: 'jamais', gras: true },
      { texte: ' de points.', gras: false },
    ]);
  });

  it('gère un gras en début et en fin de texte', () => {
    expect(decouperGras('**18 ans** minimum, **gratuit**')).toEqual([
      { texte: '18 ans', gras: true },
      { texte: ' minimum, ', gras: false },
      { texte: 'gratuit', gras: true },
    ]);
  });

  it('laisse en texte normal des étoiles sans fermante', () => {
    expect(decouperGras('Attention **pas fermé')).toEqual([{ texte: 'Attention **pas fermé', gras: false }]);
  });

  it('renvoie le texte tel quel sans gras', () => {
    expect(decouperGras('Texte simple')).toEqual([{ texte: 'Texte simple', gras: false }]);
  });
});
