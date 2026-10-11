import { initialePseudo, LIBELLE_STATUT_DONNEUR, OPTIONS_STATUT_DONNEUR } from '../profil';

describe('initialePseudo', () => {
  it('renvoie la première lettre en majuscule', () => {
    expect(initialePseudo('goutte')).toBe('G');
  });

  it('conserve un caractère accentué', () => {
    expect(initialePseudo('élan')).toBe('É');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['une chaîne vide', ''],
  ])('renvoie « ? » pour %s', (_description, pseudo) => {
    expect(initialePseudo(pseudo)).toBe('?');
  });
});

describe('statut donneur', () => {
  it('a un libellé pour chaque option proposée dans le formulaire', () => {
    for (const option of OPTIONS_STATUT_DONNEUR) {
      expect(LIBELLE_STATUT_DONNEUR[option.valeur]).toBeTruthy();
    }
  });

  it('propose les trois statuts acceptés par l’API', () => {
    expect(OPTIONS_STATUT_DONNEUR.map((o) => o.valeur)).toEqual(['donneur_regulier', 'quelques_dons', 'jamais_donne']);
  });
});
