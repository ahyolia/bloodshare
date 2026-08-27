import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { ScreenHeader } from '../../../components/ui/screen-header';
import {
  Cartes,
  CarteParrainage,
  CategorieEvenement,
  getCartes,
} from '../../../services/cartes.service';

export default function CartesScreen() {
  const router = useRouter();
  const [cartes, setCartes] = useState<Cartes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCartes()
      .then((data) => {
        if (!cancelled) setCartes(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openScan = () => router.push('/tabs/don/scan');

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Cartes" />

        {loading && (
          <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />
        )}

        {!loading && error && (
          <Text style={styles.errorText}>Impossible de charger votre collection.</Text>
        )}

        {!loading && !error && cartes && (
          <>
            <CollectionsSection cartes={cartes} onOpenScan={openScan} />
            <EvenementsSection categories={cartes.evenement.categories} />
            <ParrainageSection
              carteParrain={cartes.parrainage.carte_parrain}
              carteFilleul={cartes.parrainage.carte_filleul}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ProgressCard({
  titre,
  obtenues,
  total,
  locked,
  onPress,
}: {
  titre: string;
  obtenues: number;
  total: number;
  locked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.progressCard}
      activeOpacity={locked ? 1 : 0.88}
      onPress={onPress}
      disabled={locked}
    >
      <Text style={[styles.progressCardTitle, { color: locked ? Colors.grisMoyen : Colors.aubergine }]}>
        {titre}
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: total > 0 ? `${(obtenues / total) * 100}%` : '0%' },
          ]}
        />
      </View>

      {locked ? (
        <View style={styles.rowCenter}>
          <Ionicons name="lock-closed" size={12} color={Colors.grisMoyen} />
          <Text style={styles.futureText}>Bientôt disponible</Text>
        </View>
      ) : (
        <Text style={styles.progressCardCompteur}>
          {obtenues}/{total}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function CollectionsSection({
  cartes,
  onOpenScan,
}: {
  cartes: Cartes;
  onOpenScan: () => void;
}) {
  const router = useRouter();
  const anneeActuelle = new Date().getFullYear();
  const cartesObtenues = cartes.mois_don.cartes.filter((carte) => carte.obtenue).length;

  const annees = [
    { annee: anneeActuelle, obtenues: cartesObtenues, future: false },
    { annee: anneeActuelle + 1, obtenues: 0, future: true },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Collections</Text>
        <TouchableOpacity onPress={onOpenScan} activeOpacity={0.8}>
          <Ionicons name="qr-code-outline" size={22} color={Colors.aubergine} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {annees.map(({ annee, obtenues, future }) => (
          <ProgressCard
            key={annee}
            titre={String(annee)}
            obtenues={obtenues}
            total={12}
            locked={future}
            onPress={() => router.push({ pathname: '/tabs/cartes/mois', params: { annee } })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function EvenementsSection({ categories }: { categories: CategorieEvenement[] }) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Événements</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {categories.length === 0 ? (
          <ProgressCard titre="Événement" obtenues={0} total={0} locked onPress={() => {}} />
        ) : (
          categories.map((categorie) => {
            const obtenues = categorie.cartes.filter((carte) => carte.obtenue).length;

            return (
              <ProgressCard
                key={categorie.id}
                titre={categorie.titre}
                obtenues={obtenues}
                total={categorie.cartes.length}
                locked={categorie.cartes.length === 0}
                onPress={() =>
                  router.push({ pathname: '/tabs/cartes/evenement', params: { id: categorie.id } })
                }
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function ParrainageSection({
  carteParrain,
  carteFilleul,
}: {
  carteParrain: CarteParrainage;
  carteFilleul: CarteParrainage;
}) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Parrainage</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        <CarteSquare
          titre={carteParrain.titre}
          imageUrl={carteParrain.image_url}
          obtenue={carteParrain.obtenue}
          quantite={carteParrain.quantite}
          placeholderIcon="🤝"
          onPress={() =>
            carteParrain.obtenue &&
            router.push({ pathname: '/tabs/cartes/[id]', params: { id: carteParrain.id } })
          }
        />
        <CarteSquare
          titre={carteFilleul.titre}
          imageUrl={carteFilleul.image_url}
          obtenue={carteFilleul.obtenue}
          quantite={carteFilleul.quantite}
          placeholderIcon="🩸"
          onPress={() =>
            carteFilleul.obtenue &&
            router.push({ pathname: '/tabs/cartes/[id]', params: { id: carteFilleul.id } })
          }
        />
      </ScrollView>
    </View>
  );
}

function CarteSquare({
  titre,
  imageUrl,
  obtenue,
  quantite,
  placeholderIcon,
  onPress,
}: {
  titre: string;
  imageUrl: string | null;
  obtenue: boolean;
  quantite?: number;
  placeholderIcon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.squareCard} activeOpacity={obtenue ? 0.88 : 1} onPress={onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.squareImage} />
      ) : (
        <View style={styles.squarePlaceholder}>
          <Text style={styles.squarePlaceholderIcon}>{placeholderIcon}</Text>
        </View>
      )}

      <View style={styles.squareTitleScrim}>
        <Text style={styles.squareTitle}>{titre}</Text>
      </View>

      {!!quantite && quantite > 1 && (
        <View style={styles.quantiteBadge}>
          <Text style={styles.quantiteBadgeText}>×{quantite}</Text>
        </View>
      )}

      {!obtenue && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={22} color={Colors.blanc} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 126,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 12,
  },
  carousel: {
    paddingRight: 8,
    gap: 12,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCard: {
    width: 160,
    minHeight: 100,
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E4E6',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.corail[600],
  },
  progressCardCompteur: {
    color: Colors.grisMoyen,
    fontSize: 13,
    marginTop: 8,
  },
  futureText: {
    color: Colors.grisMoyen,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  squareCard: {
    width: 150,
    height: 150,
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  squareImage: {
    width: '100%',
    height: '100%',
  },
  squarePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.creme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squarePlaceholderIcon: {
    fontSize: 40,
  },
  squareTitleScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  squareTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.blanc,
  },
  quantiteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.corail[600],
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  quantiteBadgeText: {
    color: Colors.blanc,
    fontSize: 11,
    fontWeight: '700',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
