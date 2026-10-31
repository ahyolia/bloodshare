import { etatReponse } from '../quizCorrection';

const correction = (reponses_correctes: number[]) => ({
  correcte: false,
  reponses_correctes,
  explication: null,
  contenu: null,
});

describe('etatReponse — question pas encore validée', () => {
  it('marque la réponse cochée comme sélectionnée', () => {
    expect(etatReponse(1, [1], undefined)).toBe('selectionnee');
  });

  it('laisse les autres réponses neutres', () => {
    expect(etatReponse(2, [1], undefined)).toBe('neutre');
  });
});

describe('etatReponse — question validée', () => {
  it('montre la bonne réponse cochée comme correcte', () => {
    expect(etatReponse(1, [1], correction([1]))).toBe('correcte');
  });

  it('montre aussi la bonne réponse que l’utilisateur n’a pas cochée', () => {
    expect(etatReponse(2, [1], correction([2]))).toBe('correcte');
  });

  it('marque en erreur une mauvaise réponse cochée', () => {
    expect(etatReponse(1, [1], correction([2]))).toBe('erreur');
  });

  it('met en retrait une mauvaise réponse non cochée', () => {
    expect(etatReponse(3, [1], correction([2]))).toBe('attenuee');
  });
});
