import { readFileSync } from 'fs';
import path from 'path';

/**
 * 📖 `assets/fonts/Ionicons.ttf` est une COPIE de la police d'@expo/vector-icons
 *    (voir app/_layout.tsx : Netlify ne sert pas les fichiers sous node_modules).
 *    Si une montée de SDK change la police d'origine et qu'on oublie de recopier,
 *    les noms d'icônes ne correspondraient plus aux bons caractères : mauvaises
 *    icônes ou carrés, sans aucune erreur. Ce test transforme cet oubli en échec visible.
 */
describe('assets/fonts/Ionicons.ttf', () => {
  it('est identique à la police installée par @expo/vector-icons', () => {
    // 📖 require.resolve trouve le paquet où que npm l'ait rangé (racine ou dossier
    //    d'un autre paquet), au lieu d'écrire un chemin `node_modules/...` en dur.
    const dossierPaquet = path.dirname(require.resolve('@expo/vector-icons/package.json'));
    const original = readFileSync(
      path.join(dossierPaquet, 'build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    );
    const copie = readFileSync(path.join(__dirname, '..', 'Ionicons.ttf'));

    if (!copie.equals(original)) {
      throw new Error(
        "La police d'@expo/vector-icons a changé : recopier Ionicons.ttf depuis " +
          'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/ ' +
          'vers assets/fonts/.',
      );
    }
  });
});