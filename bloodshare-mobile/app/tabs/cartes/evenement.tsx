import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Cartes, getCartes, getCartesCache } from '../../../services/cartes.service';

export default function EvenementCategorieScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cartes, setCartes] = useState<Cartes | null>(getCartesCache());
  const [loading, setLoading] = useState(!getCartesCache());

  useEffect(() => {
    if (cartes) return;

    let cancelled = false;

    getCartes()
      .then((data) => {
        if (!cancelled) setCartes(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cartes]);

  const categorie = cartes?.evenement.categories.find((item) => item.id === id);
  const cartesObtenues = categorie?.cartes.filter((carte) => carte.obtenue).length ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.aubergine} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{categorie?.titre ?? 'Événements'}</Text>

        {categorie && (
          <Text style={styles.headerCompteur}>
            {cartesObtenues}/{categorie.cartes.length} cartes obtenues
          </Text>
        )}
      </View>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && categorie && (
        <View style={styles.grid}>
          {categorie.cartes.map((carte) => (
            <TouchableOpacity
              key={carte.id}
              style={styles.carteCard}
              activeOpacity={carte.obtenue ? 0.88 : 1}
              onPress={() =>
                carte.obtenue &&
                router.push({ pathname: '/tabs/cartes/[id]', params: { id: carte.id } })
              }
            >
              {carte.image_url ? (
                <Image source={{ uri: carte.image_url }} style={styles.carteImage} />
              ) : (
                <View style={styles.cartePlaceholder}>
                  <Text style={styles.cartePlaceholderIcon}>🎪</Text>
                </View>
              )}

              <Text style={styles.carteLabel} numberOfLines={2}>
                {carte.titre}
              </Text>

              {!!carte.quantite && carte.quantite > 1 && (
                <View style={styles.quantiteBadge}>
                  <Text style={styles.quantiteBadgeText}>×{carte.quantite}</Text>
                </View>
              )}

              {!carte.obtenue && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={20} color={Colors.blanc} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backText: {
    color: Colors.aubergine,
    fontSize: 14,
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  headerCompteur: {
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  loader: {
    marginTop: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  carteCard: {
    flexBasis: '33.33%',
    aspectRatio: 1,
    padding: 6,
  },
  carteImage: {
    flex: 1,
    borderRadius: 12,
  },
  cartePlaceholder: {
    flex: 1,
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cartePlaceholderIcon: {
    fontSize: 32,
  },
  carteLabel: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  quantiteBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.corail[600],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantiteBadgeText: {
    color: Colors.blanc,
    fontSize: 10,
    fontWeight: '700',
  },
  lockOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
