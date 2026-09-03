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
import { GainPoints, getPointsHistorique, SourcePoints } from '../../../services/points.service';
import { getProfil, Profil } from '../../../services/profil.service';

// 📖 Métadonnées d'affichage par source. Record<SourcePoints, …> → si un jour on
//    ajoute une source à l'union, le compilateur exige de compléter cette table.
const META_SOURCE: Record<SourcePoints, { emoji: string; fond: string; libelle: string }> = {
  quiz: { emoji: '📚', fond: Colors.fondBleu, libelle: 'Quiz complété' },
  parrainage: { emoji: '🤝', fond: Colors.fondVert, libelle: 'Parrainage validé' },
  defi: { emoji: '🏆', fond: Colors.fondRose, libelle: 'Défi du mois' },
};

export default function PointsScreen() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [historique, setHistorique] = useState<GainPoints[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 📖 Deux ressources indépendantes → Promise.all, un seul await.
    Promise.all([getProfil(), getPointsHistorique()])
      .then(([p, h]) => {
        if (cancelled) return;
        setProfil(p);
        setHistorique(h);
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
        <Text style={styles.retour}>← Points et progression</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && error && (
        <Text style={styles.errorText}>Impossible de charger vos points.</Text>
      )}

      {!loading && !error && profil && historique && (
        <FlatList
          data={historique}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<NiveauCard profil={profil} />}
          renderItem={({ item }) => <GainRow gain={item} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Complétez des quiz ou parrainez un ami pour gagner vos premiers points !
            </Text>
          }
        />
      )}
    </View>
  );
}

function NiveauCard({ profil }: { profil: Profil }) {
  return (
    <View style={styles.niveauCard}>
      <Text style={styles.niveauTitre}>
        Niveau {profil.niveau.niveau} — {profil.niveau.label}
      </Text>
      <Text style={styles.niveauSousTitre}>{profil.points_cumules} points cumulés</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${profil.niveau.progression}%` }]} />
      </View>

      <Text style={styles.progressLabel}>
        {profil.niveau.points_prochain_niveau !== null
          ? `${profil.points_cumules}/${profil.niveau.points_prochain_niveau} pts`
          : 'Niveau maximum atteint 🎉'}
      </Text>
    </View>
  );
}

function GainRow({ gain }: { gain: GainPoints }) {
  const meta = META_SOURCE[gain.source];
  const date = new Date(gain.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: meta.fond }]}>
        <Text style={styles.rowIconEmoji}>{meta.emoji}</Text>
      </View>

      <View style={styles.rowCentre}>
        <Text style={styles.rowLibelle}>{meta.libelle}</Text>
        <Text style={styles.rowDate}>{date}</Text>
      </View>

      <Text style={styles.rowPoints}>+{gain.points} pts</Text>
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
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 40,
  },
  liste: {
    padding: 18,
    paddingBottom: 126,
    flexGrow: 1,
  },
  niveauCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  niveauTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  niveauSousTitre: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.fondGris,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.corail[600],
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.grisMoyen,
    textAlign: 'right',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fondNeutre,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconEmoji: {
    fontSize: 16,
  },
  rowCentre: {
    flex: 1,
  },
  rowLibelle: {
    fontSize: 15,
    color: Colors.aubergine,
  },
  rowDate: {
    fontSize: 12,
    color: Colors.grisMoyen,
    marginTop: 2,
  },
  rowPoints: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.corail[600],
  },
  empty: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
