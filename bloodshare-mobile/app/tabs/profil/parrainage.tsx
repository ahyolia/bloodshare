import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { getProfil, Profil } from '../../../services/profil.service';

// 📖 Share.share() ouvre la feuille de partage NATIVE du système (iOS / Android) :
//    l'utilisateur choisit lui-même l'app de destination (SMS, WhatsApp, mail…).
//    On ne gère aucune intégration tierce, l'OS s'occupe de tout. La promesse
//    résout avec { action } : 'sharedAction' si l'utilisateur a partagé,
//    'dismissedAction' s'il a annulé (iOS uniquement).
export default function ParrainageScreen() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProfil()
      .then((p) => {
        if (!cancelled) setProfil(p);
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

  const partager = async () => {
    if (!profil) return;
    try {
      await Share.share({
        message:
          `Rejoins BloodShare et donne ton sang ! 🩸\n` +
          `Utilise mon code de parrainage : ${profil.code_parrainage}\n` +
          `https://bloodshare.nc`,
      });
    } catch {
      // 📖 Partage annulé ou indisponible : rien à signaler à l'utilisateur.
    }
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.header}
        accessibilityRole="button"
      >
        <Text style={styles.retour}>← Parrainage</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && error && (
        <Text style={styles.errorText}>Impossible de charger votre parrainage.</Text>
      )}

      {!loading && !error && profil && (
        <View style={styles.content}>
          {/* CARTE CODE */}
          <View style={styles.carteCode}>
            <Text style={styles.codeLabel}>Votre code de parrainage</Text>
            <Text style={styles.code}>{profil.code_parrainage}</Text>

            <TouchableOpacity
              style={styles.boutonPartage}
              onPress={partager}
              accessibilityRole="button"
            >
              <Text style={styles.boutonPartageTexte}>Partager mon code 📤</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separateur} />

          {/* STATS */}
          <View style={styles.carteStats}>
            <View style={styles.stat}>
              <Text style={styles.statNombre}>{profil.nb_parrainages_valides}</Text>
              <Text style={styles.statLabel}>Parrainage(s) validé(s)</Text>
            </View>
          </View>

          {/* NOTE ANONYMAT */}
          <View style={styles.noteAnonymat}>
            <Text style={styles.noteAnonymatTexte}>
              {"🔒 Par respect de la vie privée, l'identité de vos filleuls n'est pas affichée."}
            </Text>
          </View>
        </View>
      )}
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
  content: {
    padding: 18,
  },
  carteCode: {
    backgroundColor: Colors.blanc,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: 'center',
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.aubergine,
    letterSpacing: 6,
    textAlign: 'center',
    marginVertical: 16,
  },
  boutonPartage: {
    backgroundColor: Colors.corail[600],
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  boutonPartageTexte: {
    color: Colors.blanc,
    fontWeight: '700',
  },
  separateur: {
    height: 1,
    backgroundColor: Colors.fondGris,
    marginVertical: 20,
  },
  carteStats: {
    backgroundColor: Colors.blanc,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNombre: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.corail[600],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 4,
  },
  noteAnonymat: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  noteAnonymatTexte: {
    fontSize: 12,
    color: Colors.grisMoyen,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
