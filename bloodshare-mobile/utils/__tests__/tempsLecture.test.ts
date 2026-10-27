import { tempsLecture } from '../tempsLecture';

describe('tempsLecture', () => {
  it('compte au moins une minute pour un texte court', () => {
    expect(tempsLecture('Une phrase.')).toBe(1);
    expect(tempsLecture('')).toBe(1);
  });

  it('arrondit à la minute la plus proche, à 200 mots par minute', () => {
    expect(tempsLecture(Array(500).fill('mot').join(' '))).toBe(3);
  });

  it('ne compte pas les marques de mise en forme comme des mots', () => {
    const mots = Array(399).fill('mot').join(' ');
    // 399 mots + « ## », « - » et « ** » : toujours 2 minutes, pas plus.
    expect(tempsLecture(`## Titre\n- **${mots}**`)).toBe(2);
  });
});
