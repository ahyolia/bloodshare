/// <reference types="node" />
import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * 📖 Chaque police chargée par `app/_layout.tsx` doit exister dans assets/fonts/
 *    (jamais dans node_modules : Netlify ne le sert pas), et chaque police libre
 *    doit être accompagnée de sa licence OFL, condition de sa redistribution.
 */
const DOSSIER = path.join(__dirname, '..');
const layout = readFileSync(path.join(__dirname, '..', '..', '..', 'app', '_layout.tsx'), 'utf8');

describe("polices de l'app", () => {
  it.each(['NunitoSans-Regular.ttf', 'NunitoSans-Bold.ttf', 'Pacifico-Regular.ttf'])(
    '%s est présente dans assets/fonts',
    (fichier) => {
      expect(existsSync(path.join(DOSSIER, fichier))).toBe(true);
    },
  );

  it.each(['OFL-NunitoSans.txt', 'OFL-Pacifico.txt'])('la licence %s est jointe', (licence) => {
    expect(existsSync(path.join(DOSSIER, licence))).toBe(true);
  });

  it("aucune police n'est chargée depuis node_modules", () => {
    expect(layout).not.toMatch(/require\([^)]*node_modules/);
    expect(layout).not.toMatch(/@expo-google-fonts/);
  });
});