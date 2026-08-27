import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Cartes, getCartes, getCartesCache } from '../../../services/cartes.service';
import { getNomMois } from '../../../utils/mois';

export default function MoisScreen() {
  const { annee } = useLocalSearchParams<{ annee: string }>();
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

  const moisDon = cartes?.mois_don;
  const cartesObtenues = moisDon?.cartes.filter((carte) => carte.obtenue).length ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.aubergine} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{annee}</Text>

        <Text style={styles.headerCompteur}>{cartesObtenues} cartes obtenues</Text>
      </View>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && moisDon && (
        <>
          <View style={styles.grid}>
            {moisDon.cartes.map((carte) => (
              <TouchableOpacity
                key={carte.id}
                style={[styles.moisCard, !carte.obtenue && styles.moisCardVerrouillee]}
                activeOpacity={carte.obtenue ? 0.88 : 1}
                onPress={() =>
                  carte.obtenue &&
                  router.push({ pathname: '/tabs/cartes/[id]', params: { id: carte.id } })
                }
              >
                {carte.image_url ? (
                  <Image
                    source={{ uri: carte.image_url }}
                    style={[styles.moisImage, !carte.obtenue && styles.moisImageVerrouillee]}
                  />
                ) : (
                  <View
                    style={[
                      styles.moisPlaceholder,
                      !carte.obtenue && styles.moisPlaceholderVerrouillee,
                    ]}
                  >
                    <Ionicons
                      name="water"
                      size={28}
                      color={carte.obtenue ? Colors.corail[600] : Colors.grisMoyen}
                    />
                  </View>
                )}

                <Text
                  style={[
                    styles.moisLabel,
                    { color: carte.obtenue ? Colors.aubergine : Colors.grisMoyen },
                  ]}
                >
                  {getNomMois(carte.mois_numero)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.progressBlock}>
            <Text style={styles.progressText}>{cartesObtenues}/12 cartes obtenues</Text>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${(cartesObtenues / 12) * 100}%` }]}
              />
            </View>

            <Text style={styles.progressPercent}>
              {moisDon.pourcentage_complete}% de la collection
            </Text>
          </View>
        </>
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
  moisCard: {
    flexBasis: '33.33%',
    aspectRatio: 1,
    padding: 6,
  },
  moisCardVerrouillee: {},
  moisPlaceholder: {
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
  moisPlaceholderVerrouillee: {
    backgroundColor: '#E8E4E6',
    shadowOpacity: 0,
    elevation: 0,
  },
  moisImage: {
    flex: 1,
    borderRadius: 12,
  },
  moisImageVerrouillee: {
    opacity: 0.3,
  },
  moisLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  progressBlock: {
    marginTop: 24,
    alignItems: 'center',
  },
  progressText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8E4E6',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.corail[600],
  },
  progressPercent: {
    color: Colors.grisMoyen,
    fontSize: 13,
    marginTop: 8,
  },
});
