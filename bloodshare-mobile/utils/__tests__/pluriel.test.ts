import { accorder, compter } from '../pluriel';

describe('accorder', () => {
  it('reste au singulier jusqu’à 1 inclus, comme en français', () => {
    expect(accorder(0, 'don')).toBe('don');
    expect(accorder(1, 'don')).toBe('don');
    expect(accorder(1.5, 'point')).toBe('point');
  });

  it('passe au pluriel à partir de 2', () => {
    expect(accorder(2, 'Don')).toBe('Dons');
  });

  it('accorde chaque mot d’une expression', () => {
    expect(accorder(3, 'parrainage validé')).toBe('parrainages validés');
  });

  it('laisse intacts les mots finissant par s, x ou z', () => {
    expect(accorder(4, 'quiz')).toBe('quiz');
    expect(accorder(4, 'mois')).toBe('mois');
  });

  it('utilise la forme plurielle fournie pour un pluriel irrégulier', () => {
    expect(accorder(2, 'niveau', 'niveaux')).toBe('niveaux');
  });
});

describe('compter', () => {
  it('préfixe le nombre', () => {
    expect(compter(1, 'carte obtenue')).toBe('1 carte obtenue');
    expect(compter(5, 'carte obtenue')).toBe('5 cartes obtenues');
  });
});
