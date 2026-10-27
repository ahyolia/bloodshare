import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/** Format des visuels de cartes (900 × 1273 px) : celui d'une carte à collectionner. */
export const RATIO_CARTE = 900 / 1273;

/** Épaisseur du cadre blanc autour du dessin, comme une vraie carte à collectionner. */
const BORDURE_CARTE = 5;

type Props = {
  titre: string;
  imageUrl: string | null;
  obtenue: boolean;
  /** Nombre d'exemplaires obtenus : pastille « ×2 » à partir de 2. */
  quantite?: number;
  /** Largeur fixe (rangée qui défile) ou relative (grille). */
  largeur: DimensionValue;
  /** Texte sous la carte ; le titre par défaut. */
  legende?: string;
  /** Seules les cartes obtenues s'ouvrent. */
  onPress?: () => void;
};

// 📖 Carte de la collection, au vrai format portrait des illustrations (avant : recadrée
//    en carré, on perdait la moitié du dessin).
//    - Obtenue : l'illustration, surélevée (elle se touche et s'ouvre en grand).
//    - Pas encore obtenue : un aperçu grisé et estompé du dessin, à plat, avec un
//      cadenas. On voit ce qu'on peut gagner, sans confondre avec une carte obtenue.
export function CartePortrait({ titre, imageUrl, obtenue, quantite, largeur, legende = titre, onPress }: Props) {
  const ouvrable = obtenue && !!onPress;

  return (
    <Pressable
      onPress={ouvrable ? onPress : undefined}
      disabled={!ouvrable}
      accessibilityRole={ouvrable ? 'button' : undefined}
      accessibilityLabel={`${titre}, ${obtenue ? 'carte obtenue' : 'carte à obtenir'}${
        quantite && quantite > 1 ? `, ${quantite} exemplaires` : ''
      }`}
      accessibilityHint={ouvrable ? 'Affiche la carte en grand' : undefined}
      style={({ pressed }) => [{ width: largeur }, styles.conteneur, pressed && styles.presse]}
    >
      <View style={[styles.carte, obtenue && styles.obtenue]}>
        <View style={[styles.fenetre, !obtenue && styles.fenetreVerrouillee]}>
          {imageUrl ? (
            <Image
              testID="carte-illustration"
              source={{ uri: imageUrl }}
              style={[styles.image, !obtenue && styles.imageGrisee]}
              resizeMode="cover"
              accessible={false}
            />
          ) : (
            // Carte sans visuel envoyé depuis le BO : une goutte sur fond pâle.
            <View style={[styles.sansVisuel, !obtenue && styles.sansVisuelGrise]}>
              <Ionicons name="water" size={28} color={obtenue ? Theme.marque.principal : Theme.texte.desactive} />
            </View>
          )}
        </View>

        {/* 📖 Verrouillée = cadenas + aperçu grisé + légende estompée : pas la couleur seule. */}
        {!obtenue && (
          <View style={styles.cadenasZone}>
            <View style={styles.cadenas}>
              <Ionicons name="lock-closed" size={14} color={Theme.texte.principal} />
            </View>
          </View>
        )}

        {!!quantite && quantite > 1 && (
          <View style={styles.quantite}>
            <Text style={[Typo.onglet, styles.quantiteTexte]}>×{quantite}</Text>
          </View>
        )}
      </View>

      <Text
        style={[Typo.legendeForte, styles.legende, !obtenue && styles.legendeVerrouillee]}
        numberOfLines={2}
      >
        {legende}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    gap: Espace[2],
  },
  // Enfoncée au toucher, comme une carte qu'on presse du doigt.
  presse: { transform: [{ scale: 0.95 }] },
  // Le cadre blanc de la carte ; à plat quand elle est verrouillée (elle ne s'ouvre pas).
  carte: {
    width: '100%',
    aspectRatio: RATIO_CARTE,
    padding: BORDURE_CARTE,
    borderRadius: Rayon.md + BORDURE_CARTE,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
    backgroundColor: Theme.fond.surface,
  },
  obtenue: {
    ...Ombre.flottante,
  },
  // Le dessin, dans le cadre : bien arrondi, le cadre suit (rayon + épaisseur).
  fenetre: {
    flex: 1,
    borderRadius: Rayon.md,
    overflow: 'hidden',
  },
  fenetreVerrouillee: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  // Centre le cadenas par-dessus l'aperçu.
  cadenasZone: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadenas: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
    // Légèrement penché : un cadenas posé sur la carte, moins rigide.
    transform: [{ rotate: '-12deg' }],
    ...Ombre.flottante,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // 📖 filter grayscale : Android et web ; iOS l'ignore et garde l'opacité seule.
  //    Forme texte (CSS) : la forme objet [{ grayscale: 1 }] n'était pas appliquée sur le web.
  imageGrisee: {
    opacity: 0.45,
    filter: 'grayscale(1)',
  },
  sansVisuel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.marque.doux,
  },
  sansVisuelGrise: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  quantite: {
    position: 'absolute',
    top: Espace[1],
    right: Espace[1],
    paddingHorizontal: Espace[2],
    paddingVertical: 2,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.info.icone,
  },
  quantiteTexte: { color: Theme.texte.surAccent },
  legende: {
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  legendeVerrouillee: {
    color: Theme.texte.secondaire,
  },
});
