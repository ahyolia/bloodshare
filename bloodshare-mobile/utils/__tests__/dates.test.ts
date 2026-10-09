import { formaterDateLongue } from '../dates';

describe('formaterDateLongue', () => {
  describe('date valide au format AAAA-MM-JJ', () => {
    it('écrit le mois en toutes lettres (cas du ticket)', () => {
      expect(formaterDateLongue('2026-12-29')).toBe('29 décembre 2026');
    });

    it('lit la date renvoyée par le contrat d’API', () => {
      expect(formaterDateLongue('2026-07-15')).toBe('15 juillet 2026');
    });
  });

  describe('jour', () => {
    it('retire le zéro devant les jours à un chiffre', () => {
      expect(formaterDateLongue('2026-07-05')).toBe('5 juillet 2026');
    });

    it('écrit « 1er » pour le premier jour du mois', () => {
      expect(formaterDateLongue('2027-01-01')).toBe('1er janvier 2027');
    });
  });

  describe('mois', () => {
    // 📖 `it.each` lance le même test sur chaque ligne du tableau : un seul test à
    //    lire, mais chaque mois est vérifié et signalé séparément en cas d'échec.
    it.each([
      ['2026-02-10', '10 février 2026'],
      ['2026-08-10', '10 août 2026'],
      ['2026-12-10', '10 décembre 2026'],
    ])('%s → %s (minuscule, accents conservés)', (entree, attendu) => {
      expect(formaterDateLongue(entree)).toBe(attendu);
    });
  });

  describe('format inattendu : renvoie la valeur telle quelle', () => {
    it.each([
      ['une date-heure', '2026-12-29T10:00:00Z'],
      ['une chaîne vide', ''],
      ['un mois inexistant', '2026-13-10'],
      ['un jour à zéro', '2026-12-00'],
      ['un jour impossible', '2026-12-45'],
      ['un autre format', '29/12/2026'],
    ])('%s', (_description, entree) => {
      expect(formaterDateLongue(entree)).toBe(entree);
    });
  });
});