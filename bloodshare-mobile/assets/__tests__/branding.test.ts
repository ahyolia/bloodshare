/// <reference types="node" />
import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * 📖 Les icônes sont déclarées à trois endroits (app.json, manifest.json,
 *    +html.tsx) et livrées par l'équipe strat. Un chemin cassé ou un export à la
 *    mauvaise taille ne provoque aucune erreur : l'icône du modèle Expo ou un
 *    carré vide s'affiche à la place. Ce test rend ces erreurs visibles.
 */
const RACINE = path.join(__dirname, '..', '..');

const lireJson = (fichier: string) =>
  JSON.parse(readFileSync(path.join(RACINE, fichier), 'utf8'));

// 📖 La largeur et la hauteur d'un PNG sont écrites dans son en-tête
//    (octets 16 à 23) : pas besoin d'une librairie d'images pour les lire.
function taillePng(fichier: string) {
  const octets = readFileSync(fichier);
  return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20) };
}

const expo = lireJson('app.json').expo;
const manifest = lireJson('public/manifest.json');
const splash = expo.plugins.find(
  (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
)[1];

describe('icônes déclarées dans app.json', () => {
  it.each([
    ['icône principale', expo.icon],
    ['favicon', expo.web.favicon],
    ['Android, premier plan', expo.android.adaptiveIcon.foregroundImage],
    ['Android, arrière-plan', expo.android.adaptiveIcon.backgroundImage],
    ['Android, monochrome', expo.android.adaptiveIcon.monochromeImage],
    ['splash', splash.image],
  ])('%s : le fichier existe', (_nom, chemin) => {
    expect(existsSync(path.join(RACINE, chemin))).toBe(true);
  });

  it("l'icône principale fait 1024 × 1024", () => {
    expect(taillePng(path.join(RACINE, expo.icon))).toEqual({ largeur: 1024, hauteur: 1024 });
  });
});

describe('icônes de la PWA', () => {
  const icones: { src: string; sizes: string; purpose: string }[] = manifest.icons;

  it.each(icones.map((icone) => [icone.src, icone.sizes]))(
    '%s existe et fait %s',
    (src, sizes) => {
      const fichier = path.join(RACINE, 'public', src);
      const [largeur, hauteur] = sizes.split('x').map(Number);

      expect(existsSync(fichier)).toBe(true);
      expect(taillePng(fichier)).toEqual({ largeur, hauteur });
    },
  );

  it('déclare une icône maskable pour Android', () => {
    expect(icones.some((icone) => icone.purpose === 'maskable')).toBe(true);
  });

  it("l'icône Apple (écran d'accueil iOS) fait 180 × 180", () => {
    const fichier = path.join(RACINE, 'public/icons/apple-touch-icon.png');
    expect(taillePng(fichier)).toEqual({ largeur: 180, hauteur: 180 });
  });
});