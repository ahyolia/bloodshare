import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Don, DonsReponse, getDons } from '../../../services/dons.service';

// 📖 FlatList vs ScrollView :
//    - ScrollView monte TOUS ses enfants d'un coup → parfait pour un contenu
//      court et fini (un formulaire, une fiche). Au-delà de quelques dizaines
//      d'éléments, la mémoire et le temps de montage explosent.
//    - FlatList est "virtualisée" : elle ne rend que les lignes visibles (+ un
//      petit tampon) et recycle les vues en défilant. C'est le bon choix pour
//      une liste potentiellement longue et dont on ne connaît pas la taille,
//      comme l'historique des dons. Elle gère aussi nativement keyExtractor,
//      séparateurs, pull-to-refresh et l'état vide (ListEmptyComponent).
export default function HistoriqueDonsScreen() {
  const router = useRouter();
  const [data, setData] = useState<DonsReponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getDons()
      .then((d) => {
        if (!cancelled) setData(d);
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

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.header}
        accessibilityRole="button"
      >
        <Text style={styles.retour}>← Historique des dons</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && error && (
        <Text style={styles.errorText}>Impossible de charger vos dons.</Text>
      )}

      {!loading && !error && data && (
        <>
          <Text style={styles.sousTitre}>
            {data.total_dons} don{data.total_dons > 1 ? 's' : ''} effectué
            {data.total_dons > 1 ? 's' : ''}
          </Text>

          <FlatList
            data={data.dons}
            keyExtractor={(don) => String(don.id)}
            contentContainerStyle={styles.liste}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <DonCard don={item} />}
            ListEmptyComponent={<EmptyDons onScan={() => router.push('/tabs/don')} />}
          />
        </>
      )}
    </View>
  );
}

function DonCard({ don }: { don: Don }) {
  const dateLisible = new Date(don.date_don).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const estEvenement = don.type === 'evenement';

  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconEmoji}>🩸</Text>
      </View>

      <View style={styles.cardCentre}>
        <Text style={styles.cardDate}>{dateLisible}</Text>
        <Text style={styles.cardCarte}>
          {don.carte_obtenue?.titre ?? 'Carte non disponible'}
        </Text>
      </View>

      <View
        style={[
          styles.pill,
          { backgroundColor: estEvenement ? Colors.petrole[500] : Colors.corail[600] },
        ]}
      >
        <Text style={styles.pillText}>{estEvenement ? 'Événement' : 'Don centre'}</Text>
      </View>
    </View>
  );
}

function EmptyDons({ onScan }: { onScan: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🩸</Text>
      <Text style={styles.emptyTitre}>{"Vous n'avez pas encore donné"}</Text>
      <Text style={styles.emptyTexte}>
        {"Scannez un QR Code au centre de don ou lors d'un événement."}
      </Text>
      <TouchableOpacity style={styles.emptyBouton} onPress={onScan} accessibilityRole="button">
        <Text style={styles.emptyBoutonTexte}>Aller au don</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingTop: 54,
  },
  header: {
    paddingHorizontal: 18,
  },
  retour: {
    fontSize: 15,
    color: Colors.petrole[500],
    fontWeight: '600',
  },
  sousTitre: {
    fontSize: 14,
    color: Colors.grisMoyen,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 40,
  },
  liste: {
    padding: 8,
    paddingBottom: 126,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    margin: 8,
    padding: 16,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.corail[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconEmoji: {
    fontSize: 18,
  },
  cardCentre: {
    flex: 1,
    marginLeft: 12,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  cardCarte: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginTop: 2,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    color: Colors.blanc,
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitre: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyTexte: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyBouton: {
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  emptyBoutonTexte: {
    color: Colors.blanc,
    fontWeight: '700',
  },
});
