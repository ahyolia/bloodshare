/// <reference types="node" />
import { readFileSync } from 'fs';
import path from 'path';
import { Police, Typo } from '../typography';

/**
 * 📖 Protège les deux erreurs silencieuses de la typographie :
 *    - une famille absente du useFonts de _layout.tsx → police système, sans erreur ;
 *    - un `fontWeight` ajouté à une police personnalisée → police système sur iOS.
 */
const layout = readFileSync(path.join(__dirname, '..', '..', 'app', '_layout.tsx'), 'utf8');

describe('typographie', () => {
  it.each(Object.values(Police))('la famille %s est chargée dans _layout.tsx', (famille) => {
    expect(layout).toContain(`"${famille}"`);
  });

  it.each(Object.entries(Typo))('%s n’utilise pas fontWeight', (_nom, style) => {
    expect(style).not.toHaveProperty('fontWeight');
  });

  it.each(Object.entries(Typo))('%s a un interligne au moins égal à sa taille', (_nom, style) => {
    expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
  });

  it('Pacifico est réservée au titre de page', () => {
    const avecPacifico = Object.entries(Typo)
      .filter(([, style]) => style.fontFamily === Police.titre)
      .map(([nom]) => nom);

    expect(avecPacifico).toEqual(['titre1']);
  });
});