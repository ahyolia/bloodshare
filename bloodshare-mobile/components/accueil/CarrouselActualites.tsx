import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE, TEINTES_VIVES, type TeintePastille } from '../../constants/teintes';
import { Typo } from '../../constants/typography';
import type { Actualite } from '../../services/actualites.service';
import { dateActualite } from '../../utils/accueil';

type Props = {
  actualites: Actualite[];
  /** `teinte` : celle de la carte, reprise par la page détail. */
  onOuvrir: (actualite: Actualite, teinte: TeintePastille) => void;
  /** Marge de la page : la rangée en déborde, pour qu'on voie qu'elle défile. */
  marge: number;
};

const LARGEUR = 260;
const ECART = Espace[3];
const PAS = LARGEUR + ECART;
const HAUTEUR_VISUEL = 128;

// Sans image, chaque carte prend une teinte de la marque, à tour de rôle.
const TEINTES: TeintePastille[] = ['corail', 'petrole', 'mousse', 'orange'];

// 📖 Carrousel des actualités : des cartes surélevées (elles s'ouvrent), qui s'arrêtent
//    chacune bien calée au début de la rangée, et des points qui suivent la carte vue.
export function CarrouselActualites({ actualites, onOuvrir, marge }: Props) {
  const [page, setPage] = useState(0);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAS}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / PAS);
          setPage(Math.max(0, Math.min(index, actualites.length - 1)));
        }}
        style={{ marginHorizontal: -marge }}
        contentContainerStyle={[styles.rangee, { paddingHorizontal: marge }]}
      >
        {actualites.map((actualite, index) => {
          const teinte = TEINTES[index % TEINTES.length];
          return (
            <CarteActualite
              key={actualite.id}
              actualite={actualite}
              teinte={teinte}
              onPress={() => onOuvrir(actualite, teinte)}
            />
          );
        })}
      </ScrollView>

      {actualites.length > 1 && (
        <View style={styles.points} accessible={false}>
          {actualites.map((actualite, index) => (
            <View key={actualite.id} style={[styles.point, index === page && styles.pointActif]} />
          ))}
        </View>
      )}
    </View>
  );
}

function CarteActualite({
  actualite,
  teinte,
  onPress,
}: {
  actualite: Actualite;
  teinte: TeintePastille;
  onPress: () => void;
}) {
  const date = dateActualite(actualite.published_at);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${actualite.titre}, publiée le ${date}`}
      style={({ pressed }) => [styles.carte, pressed && styles.presse]}
    >
      {/* overflow: hidden sur une vue intérieure : le visuel est rogné, pas l'ombre. */}
      <View style={styles.interieur}>
        {actualite.image_url ? (
          <Image source={{ uri: actualite.image_url }} style={styles.visuel} accessibilityIgnoresInvertColors />
        ) : (
          // Pas d'image : un aplat pastel et un journal en sticker, comme les cartes de fiche.
          <View style={[styles.visuel, { backgroundColor: TEINTES_PASTILLE[teinte].fond }]}>
            <View style={styles.sticker}>
              <Ionicons name="newspaper" size={96} color={TEINTES_VIVES[teinte]} />
            </View>
          </View>
        )}

        <View style={styles.pilule}>
          <Ionicons name="time-outline" size={13} color={Theme.texte.principal} />
          <Text style={[Typo.legendeForte, styles.texte]}>{date}</Text>
        </View>

        <View style={styles.bas}>
          <Text style={[Typo.corpsFort, styles.texte, styles.titre]} numberOfLines={2}>
            {actualite.titre}
          </Text>
          <View style={styles.lire}>
            <Text style={[Typo.legendeForte, styles.lien]}>Lire</Text>
            <Ionicons name="arrow-forward" size={14} color={Theme.info.icone} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 📖 De la place pour l'ombre des cartes, que le ScrollView rognerait.
  rangee: {
    gap: ECART,
    paddingTop: Espace[1],
    paddingBottom: Espace[6],
  },
  carte: {
    width: LARGEUR,
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  presse: { transform: [{ scale: 0.97 }] },
  interieur: {
    flex: 1,
    borderRadius: Rayon.lg,
    overflow: 'hidden',
  },
  visuel: {
    width: '100%',
    height: HAUTEUR_VISUEL,
    overflow: 'hidden',
  },
  sticker: {
    position: 'absolute',
    right: -14,
    bottom: -22,
    opacity: 0.35,
    transform: [{ rotate: '-12deg' }],
  },
  pilule: {
    position: 'absolute',
    top: Espace[3],
    left: Espace[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Espace[2],
    paddingVertical: 2,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
  },
  bas: {
    flex: 1,
    padding: Espace[3],
    gap: Espace[2],
    justifyContent: 'space-between',
  },
  texte: { color: Theme.texte.principal },
  // Deux lignes réservées : toutes les cartes ont la même hauteur.
  titre: { minHeight: 48 },
  lire: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lien: { color: Theme.info.icone },
  points: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Espace[1],
    marginTop: -Espace[2],
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.bordure,
  },
  pointActif: {
    width: 20,
    backgroundColor: Theme.action.primaire,
  },
});
