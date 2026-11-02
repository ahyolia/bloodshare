import { getNomMois, NOMS_MOIS } from '../mois';

describe('getNomMois', () => {
  it.each([
    [1, 'Janvier'],
    [2, 'Février'],
    [8, 'Août'],
    [12, 'Décembre'],
  ])('%i → %s', (numero, nom) => {
    expect(getNomMois(numero)).toBe(nom);
  });

  it.each([0, 13, -1])('renvoie une chaîne vide pour un numéro hors 1-12 (%i)', (numero) => {
    expect(getNomMois(numero)).toBe('');
  });

  it('couvre les 12 mois', () => {
    expect(Object.keys(NOMS_MOIS)).toHaveLength(12);
  });
});
