import { initialePseudo } from '../profil';

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
