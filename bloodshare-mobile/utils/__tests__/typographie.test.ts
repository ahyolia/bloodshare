import { avecEspacesInsecables, espacesInsecablesPartout } from '../typographie';

const NBSP = ' ';

describe('avecEspacesInsecables', () => {
  it('rend insécable l’espace avant ? ! : ;', () => {
    expect(avecEspacesInsecables('Qui peut donner ? Oui ! Attention : rappel ; fin')).toBe(
      `Qui peut donner${NBSP}? Oui${NBSP}! Attention${NBSP}: rappel${NBSP}; fin`
    );
  });

  it('traite les guillemets français', () => {
    expect(avecEspacesInsecables('« Le saviez-vous ? »')).toBe(`«${NBSP}Le saviez-vous${NBSP}?${NBSP}»`);
  });

  it('ne touche pas aux URL ni aux textes sans espace avant la ponctuation', () => {
    expect(avecEspacesInsecables('https://www.dondusang.nc/ et 10:30')).toBe('https://www.dondusang.nc/ et 10:30');
  });
});

describe('espacesInsecablesPartout', () => {
  it('parcourt objets et tableaux sans toucher aux autres valeurs', () => {
    expect(
      espacesInsecablesPartout({ id: 3, titre: 'Prêt ?', actif: true, vide: null, liste: ['Oui !'] })
    ).toEqual({ id: 3, titre: `Prêt${NBSP}?`, actif: true, vide: null, liste: [`Oui${NBSP}!`] });
  });

  it('laisse tels quels les champs saisis par l’utilisateur, même imbriqués', () => {
    expect(
      espacesInsecablesPartout({ user: { pseudo: 'Toto !', email: 'a@b.nc' }, classement: [{ pseudo: 'Lou ?' }] })
    ).toEqual({ user: { pseudo: 'Toto !', email: 'a@b.nc' }, classement: [{ pseudo: 'Lou ?' }] });
  });
});
