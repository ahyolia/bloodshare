import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import type { CollectionMois } from '../../services/cartes.service';
import { compter } from '../../utils/pluriel';
import { BarreProgression } from '../ui/BarreProgression';

const APERCU_MAX = 3;
const VIGNETTE_LARGEUR = 44;
// Format A4, comme les cartes.
const VIGNETTE_HAUTEUR = Math.round(VIGNETTE_LARGEUR * 1.414);

type Props = {
  collection: CollectionMois;
  /** Collection de l'année en cours : signalée par un texte, pas une couleur. */
  enCours: boolean;
  onPress: () => void;
};

// 📖 Une collection de cartes du mois (une année) résumée en un bloc : les dernières
//    cartes obtenues en éventail, la progression sur 12, et un chevron. Le toucher ouvre
//    la collection en entier (tabs/cartes/collection/[annee]).
//    Surélevé (Ombre.flottante) : dans l'app, surélevé = ça mène quelque part.
export function BlocCollection({ collection, enCours, onPress }: Props) {
  const obtenues = collection.cartes.filter((carte) => carte.obtenue);
  const apercu = [...obtenues].sort((a, b) => b.mois_numero - a.mois_numero).slice(0, APERCU_MAX);
  const detail = `${compter(obtenues.length, 'carte')} sur 12`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Collection ${collection.annee}${enCours ? ', en cours' : ''}, ${detail}`}
      accessibilityHint="Affiche toutes les cartes de la collection"
      style={({ pressed }) => [styles.bloc, pressed && styles.presse]}
    >
      <View style={styles.apercu} accessible={false}>
        {apercu.length > 0 ? (
          apercu.map((carte, rang) => (
            <View
              key={carte.id}
              style={[
                styles.vignette,
                styles.vignetteCarte,
                { left: rang * 14, zIndex: APERCU_MAX - rang, transform: [{ rotate: `${(rang - 1) * 6}deg` }] },
              ]}
            >
              {carte.image_url ? (
                <Image source={{ uri: carte.image_url }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.sansVisuel}>
                  <Ionicons name="water" size={16} color={Theme.marque.principal} />
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={[styles.vignette, styles.vignetteVide]}>
            <Ionicons name="lock-closed" size={16} color={Theme.texte.secondaire} />
          </View>
        )}
      </View>

      <View style={styles.textes}>
        <View style={styles.titreLigne}>
          <Text style={[Typo.corpsFort, styles.titre]}>Collection {collection.annee}</Text>
          {enCours && (
            <View style={styles.enCours}>
              <Text style={[Typo.onglet, styles.enCoursTexte]}>En cours</Text>
            </View>
          )}
        </View>
        <BarreProgression
          titre={`Collection ${collection.annee}`}
          titreMasque
          fine
          valeur={obtenues.length}
          max={12}
          detail={detail}
        />
      </View>

      <Ionicons name="chevron-forward" size={20} color={Theme.texte.principal} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bloc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[4],
    minHeight: 44,
    padding: Espace[4],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  presse: { opacity: 0.85 },
  apercu: {
    width: VIGNETTE_LARGEUR + (APERCU_MAX - 1) * 14,
    height: VIGNETTE_HAUTEUR + Espace[2],
    justifyContent: 'center',
  },
  vignette: {
    position: 'absolute',
    width: VIGNETTE_LARGEUR,
    height: VIGNETTE_HAUTEUR,
    borderRadius: Rayon.sm,
    borderWidth: 2,
    borderColor: Theme.fond.surface,
    overflow: 'hidden',
  },
  vignetteCarte: {
    backgroundColor: Theme.marque.doux,
    ...Ombre.flottante,
  },
  // Aucune carte obtenue : un emplacement vide, cadenas au centre.
  vignetteVide: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: Theme.fond.bordure,
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sansVisuel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: {
    flex: 1,
    gap: Espace[2],
  },
  titreLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Espace[2],
  },
  titre: {
    color: Theme.texte.principal,
  },
  enCours: {
    paddingHorizontal: Espace[2],
    paddingVertical: 2,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.accent.signatureAplat,
  },
  enCoursTexte: {
    color: Theme.accent.signatureTexte,
  },
});
