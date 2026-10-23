import { motDePasseValide } from '../motDePasse';

describe('motDePasseValide', () => {
  it('accepte 8 caractères avec majuscule, minuscule et chiffre', () => {
    expect(motDePasseValide('Aima2026')).toBe(true);
  });

  it('refuse un mot de passe trop court', () => {
    expect(motDePasseValide('Aima26')).toBe(false);
  });

  it('exige une majuscule, une minuscule et un chiffre', () => {
    expect(motDePasseValide('aima2026')).toBe(false);
    expect(motDePasseValide('AIMA2026')).toBe(false);
    expect(motDePasseValide('Aimaaima')).toBe(false);
  });
});
