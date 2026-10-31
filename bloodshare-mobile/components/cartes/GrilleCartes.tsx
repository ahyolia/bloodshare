import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Espace } from '../../constants/spacing';
import { CartePortrait } from './CartePortrait';

export type CarteGrille = {
  id: number;
  titre: string;
  image_url: string | null;
  obtenue: boolean;
  quantite?: number;
  /** Texte sous la carte (ex. le mois) ; le titre par défaut. */
  legende?: string;
};

const COLONNES = 3;

/** Découpe la liste en lignes : la dernière ligne garde des cartes de même largeur. */
const enLignes = <T,>(elements: T[]): T[][] =>
  Array.from({ length: Math.ceil(elements.length / COLONNES) }, (_, i) =>
    elements.slice(i * COLONNES, i * COLONNES + COLONNES),
  );

// 📖 Les cartes arrivent l'une après l'autre, comme distribuées, avec un petit rebond.
//    Rang plafonné : la 12e carte n'attend pas une demi-seconde. Reanimated saute
//    l'animation si « Réduire les animations » est activé.
const distribution = (rang: number, delaiDepart: number) =>
  FadeInDown.delay(delaiDepart + Math.min(rang, 8) * 45)
    .springify()
    .damping(14)
    .stiffness(160);

// 📖 Toute la collection d'un coup d'œil (plutôt qu'un carrousel, où l'on ne voit que
//    trois cartes) : 3 par ligne, assez grandes pour voir l'illustration, les 12 mois
//    tiennent en 4 lignes.
export function GrilleCartes({
  cartes,
  onOuvrir,
  delaiDepart = 0,
}: {
  cartes: CarteGrille[];
  onOuvrir: (id: number) => void;
  /** Attente avant la première carte (ms), pour suivre l'arrivée de la section. */
  delaiDepart?: number;
}) {
  return (
    <View style={styles.grille}>
      {enLignes(cartes).map((ligne, i) => (
        <View key={i} style={styles.ligne}>
          {ligne.map((carte, j) => (
            <Animated.View
              key={carte.id}
              entering={distribution(i * COLONNES + j, delaiDepart)}
              style={styles.case}
            >
              <CartePortrait
                titre={carte.titre}
                legende={carte.legende}
                imageUrl={carte.image_url}
                obtenue={carte.obtenue}
                quantite={carte.quantite}
                largeur="100%"
                onPress={() => onOuvrir(carte.id)}
              />
            </Animated.View>
          ))}
          {/* Cases vides : la dernière ligne garde des cartes de même largeur. */}
          {Array.from({ length: COLONNES - ligne.length }, (_, k) => (
            <View key={`vide-${k}`} style={styles.case} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grille: {
    gap: Espace[4],
  },
  ligne: {
    flexDirection: 'row',
    gap: Espace[3],
  },
  case: { flex: 1 },
});
