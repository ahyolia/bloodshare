import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { getCartesCache } from '../../../services/cartes.service';

type Categorie = 'mois_don' | 'evenement' | 'parrain' | 'filleul';

const CATEGORY_LABELS: Record<Categorie, string> = {
  mois_don: 'Don du sang',
  evenement: 'Événement',
  parrain: 'Parrainage',
  filleul: 'Parrainage',
};

const CATEGORY_COLORS: Record<Categorie, string> = {
  mois_don: Colors.corail[600],
  evenement: Colors.corail[600],
  parrain: Colors.petrole[500],
  filleul: Colors.petrole[500],
};

const CATEGORY_ICONS: Record<Categorie, keyof typeof Ionicons.glyphMap> = {
  mois_don: 'water',
  evenement: 'sparkles',
  parrain: 'people',
  filleul: 'heart',
};

function findCarte(id: number) {
  const cartes = getCartesCache();
  if (!cartes) return undefined;

  const carteMois = cartes.mois_don.cartes.find((carte) => carte.id === id);
  if (carteMois) {
    return { categorie: 'mois_don' as Categorie, carte: carteMois };
  }

  for (const categorieEvenement of cartes.evenement.categories) {
    const carteEvenement = categorieEvenement.cartes.find((carte) => carte.id === id);
    if (carteEvenement) {
      return { categorie: 'evenement' as Categorie, carte: carteEvenement };
    }
  }

  if (cartes.parrainage.carte_parrain.id === id) {
    return { categorie: 'parrain' as Categorie, carte: cartes.parrainage.carte_parrain };
  }

  if (cartes.parrainage.carte_filleul.id === id) {
    return { categorie: 'filleul' as Categorie, carte: cartes.parrainage.carte_filleul };
  }

  return undefined;
}

export default function CarteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const result = useMemo(() => findCarte(Number(id)), [id]);

  const close = () => router.back();

  if (!result) {
    return (
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
        <View style={styles.card}>
          <Text style={styles.errorText}>Impossible d'afficher cette carte.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <Ionicons name="close" size={20} color={Colors.aubergine} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { categorie, carte } = result;
  const quantite = 'quantite' in carte ? carte.quantite : undefined;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />

      <View style={styles.card}>
        <TouchableOpacity style={styles.closeButton} onPress={close}>
          <Ionicons name="close" size={20} color={Colors.aubergine} />
        </TouchableOpacity>

        <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[categorie] }]}>
          <Text style={styles.categoryBadgeText}>{CATEGORY_LABELS[categorie]}</Text>
        </View>

        {carte.image_url ? (
          <Image source={{ uri: carte.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name={CATEGORY_ICONS[categorie]} size={56} color={CATEGORY_COLORS[categorie]} />
          </View>
        )}

        <Text style={styles.titre}>{carte.titre}</Text>

        {categorie === 'mois_don' && carte.obtenue && (
          <>
            <Text style={styles.donText}>Vous avez donné votre sang ce mois-ci</Text>
            <Text style={styles.merciText}>Merci beaucoup de votre action !</Text>
          </>
        )}

        {!!quantite && quantite > 1 && <Text style={styles.quantiteText}>Obtenue ×{quantite}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    alignSelf: 'center',
    marginTop: '35%',
    width: '85%',
    backgroundColor: Colors.blanc,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  categoryBadgeText: {
    color: Colors.blanc,
    fontSize: 11,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: Colors.creme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    marginTop: 12,
    textAlign: 'center',
  },
  donText: {
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  merciText: {
    color: Colors.petrole[500],
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  quantiteText: {
    color: Colors.corail[600],
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    color: Colors.grisMoyen,
    fontSize: 15,
    textAlign: 'center',
  },
});
