import { criteresMotDePasse, estMotDePasseValide } from '../motDePasse';

const etat = (motDePasse: string) =>
  Object.fromEntries(criteresMotDePasse(motDePasse).map((c) => [c.id, c.valide]));

describe('criteresMotDePasse', () => {
  it('rien n’est validé pour un mot de passe vide', () => {
    expect(etat('')).toEqual({ longueur: false, majuscule: false, minuscule: false, chiffre: false });
  });

  it('valide chaque critère indépendamment', () => {
    expect(etat('abcdefgh')).toEqual({ longueur: true, majuscule: false, minuscule: true, chiffre: false });
    expect(etat('A1')).toEqual({ longueur: false, majuscule: true, minuscule: false, chiffre: true });
  });

  // 📖 Cas qui échouait avec [A-Z] / [a-z] alors que le back l'accepte.
  it.each([
    ['Ébène2026', 'majuscule accentuée'],
    ['ÉTÉ2026à', 'minuscule accentuée'],
  ])('%s : %s reconnue', (motDePasse) => {
    expect(estMotDePasseValide(motDePasse)).toBe(true);
  });

  // 📖 Mêmes classes Unicode que Laravel (\pN) : un chiffre pleine chasse compte.
  it('reconnaît les chiffres hors ASCII, comme le back', () => {
    expect(etat('Aimaaima２').chiffre).toBe(true);
  });

  it('compte les vrais caractères, pas les unités UTF-16', () => {
    // 4 emojis = 8 unités UTF-16 mais 4 caractères : trop court, comme pour Laravel.
    expect(etat('😀😀😀😀').longueur).toBe(false);
  });
});

describe('estMotDePasseValide', () => {
  it.each(['Lumi2026', 'MotDePasse1', 'Aima2026'])('%s est valide', (motDePasse) => {
    expect(estMotDePasseValide(motDePasse)).toBe(true);
  });

  it.each(['lumi2026', 'LUMI2026', 'LumiLumi', 'Lu1', 'Aima26'])('%s est refusé', (motDePasse) => {
    expect(estMotDePasseValide(motDePasse)).toBe(false);
  });
});
