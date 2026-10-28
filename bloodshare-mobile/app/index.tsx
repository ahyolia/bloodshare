import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/colors';
import { Espace } from '../constants/spacing';
import { Typo } from '../constants/typography';
import { FondDecoratif, type Forme } from '../components/ui/FondDecoratif';

/**
 * Splash affiché à chaque lancement (FO-03, maquette « Splash »).
 *
 * 📖 Cet écran ne décide pas où aller : c'est le garde de `app/_layout.tsx` qui
 *    redirige, une fois DUREE_MIN_SPLASH_MS écoulée.
 * 📖 « Aïma » est une IMAGE (logo officiel) : le cœur du ï n'existe dans aucune
 *    police, et Transforma Script n'est pas embarquée (licence).
 * 📖 Logos partenaires (association, centre) masqués tant qu'on n'a ni les fichiers
 *    ni l'accord de les utiliser.
 */
const FORMES: Forme[] = [
  { type: 'ellipse', couleur: 'rose', taille: 320, etirement: 1.1, position: { top: -60, right: -110 } },
  { type: 'rond', couleur: 'corail', taille: 70, position: { top: 120, left: 24 } },
  { type: 'rond', couleur: 'lime', taille: 260, position: { bottom: -90, left: -80 } },
  { type: 'rond', couleur: 'petrole', taille: 28, position: { bottom: 230, right: 48 } },
];

// 📖 Proportions du fichier (1520 × 476) : la hauteur suit la largeur choisie.
const LARGEUR_LOGO = 220;
const HAUTEUR_LOGO = Math.round((LARGEUR_LOGO * 476) / 1520);

export default function Splash() {
  return (
    <FondDecoratif formes={FORMES}>
      <View
        style={styles.contenu}
        accessible
        accessibilityLabel="Aïma, le don du sang en Nouvelle-Calédonie. Chargement en cours."
      >
        <Image
          source={require('../assets/images/aima-logo.png')}
          style={{ width: LARGEUR_LOGO, height: HAUTEUR_LOGO }}
          resizeMode="contain"
        />
        <Text style={[Typo.corps, styles.accroche]}>
          Le don du sang en Nouvelle-Calédonie, chaleureux et ludique.
        </Text>
        <ActivityIndicator color={Theme.texte.secondaire} style={styles.chargement} />
      </View>
    </FondDecoratif>
  );
}

const styles = StyleSheet.create({
  contenu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espace[8],
    gap: Espace[4],
  },
  accroche: { color: Theme.texte.secondaire, textAlign: 'center', maxWidth: 260 },
  chargement: { marginTop: Espace[6] },
});