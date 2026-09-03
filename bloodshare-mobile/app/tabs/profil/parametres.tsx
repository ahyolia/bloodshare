import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { supprimerCompte } from '../../../services/profil.service';
import { removeToken } from '../../../stores/auth.store';
import {
  getNotificationsActivees,
  getPenurieActivee,
  setNotificationsActivees,
  setPenurieActivee,
} from '../../../utils/preferences';

const URL_CONFIDENTIALITE = 'https://bloodshare.nc/privacy';
const URL_CGU = 'https://bloodshare.nc/cgu';

// 📖 expo-notifications ne fonctionne plus dans Expo Go (SDK 53+) et son simple
//    import y jette une erreur. On le charge donc en `require()` paresseux, à
//    l'intérieur d'un try/catch, et seulement hors Expo Go. En Expo Go on se
//    contente d'enregistrer la préférence : la vraie demande de permission se
//    fera sur un build de développement.
const EST_EXPO_GO = Constants.executionEnvironment === 'storeClient';

async function demanderPermissionNotifs(): Promise<boolean> {
  if (EST_EXPO_GO) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const demande = await Notifications.requestPermissionsAsync();
    return demande.status === 'granted';
  } catch {
    // Module indisponible (Expo Go) → on ne bloque pas l'utilisateur.
    return true;
  }
}

// 📖 AsyncStorage vs SecureStore pour les préférences :
//    - SecureStore chiffre chaque valeur (keychain iOS / keystore Android).
//      Indispensable pour un secret (token d'auth), mais lent et limité en
//      taille. Un vol du téléphone ne révèle pas la valeur.
//    - AsyncStorage est un simple key/value en clair sur le disque de l'app.
//      Rapide, sans quota gênant. Parfait pour des réglages d'affichage non
//      sensibles : si quelqu'un lit "notifications = true", aucun risque.
//    → Les deux toggles ci-dessous vont dans AsyncStorage (via utils/preferences).
export default function ParametresScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState(false);
  const [penurie, setPenurie] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getNotificationsActivees(), getPenurieActivee()]).then(([n, p]) => {
      if (cancelled) return;
      setNotifs(n);
      setPenurie(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 📖 Les notifications push exigent une permission explicite de l'OS : recevoir
  //    des alertes est intrusif (son, bandeau, badge) et l'utilisateur doit
  //    pouvoir refuser. Activer le toggle ne suffit donc pas — on demande la
  //    permission système ; si elle est refusée, on remet le toggle à OFF.
  const basculerNotifs = async (valeur: boolean) => {
    if (valeur) {
      const accorde = await demanderPermissionNotifs();
      if (!accorde) {
        Alert.alert(
          'Permission refusée',
          'Activez les notifications pour BloodShare dans les réglages de votre téléphone.'
        );
        setNotifs(false);
        await setNotificationsActivees(false);
        return;
      }
    }
    setNotifs(valeur);
    await setNotificationsActivees(valeur);
  };

  const basculerPenurie = async (valeur: boolean) => {
    setPenurie(valeur);
    await setPenurieActivee(valeur);
  };

  // 📖 Double confirmation : la suppression est irréversible. Un premier Alert
  //    explique, un second force un choix "destructive" volontaire.
  const supprimer = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Dernière confirmation', 'Voulez-vous vraiment tout supprimer ?', [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Supprimer définitivement',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await supprimerCompte();
                    await removeToken();
                    router.replace('/auth/login');
                  } catch {
                    Alert.alert('Erreur', 'La suppression a échoué. Réessayez.');
                  }
                },
              },
            ]),
        },
      ]
    );
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.retour}>← Paramètres</Text>
        </TouchableOpacity>

        {/* COMPTE */}
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.card}>
          <LigneLien
            label="Modifier mes informations"
            onPress={() => router.push('/tabs/profil/informations')}
          />
          <LigneLien
            label="Mot de passe oublié"
            onPress={() => router.push('/auth/mot-de-passe-oublie')}
            dernier
          />
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <LigneSwitch label="Notifications push" valeur={notifs} onChange={basculerNotifs} />
          <LigneSwitch
            label="Alertes pénurie de sang"
            valeur={penurie}
            onChange={basculerPenurie}
            dernier
          />
        </View>

        {/* À PROPOS */}
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.card}>
          <LigneLien
            label="Politique de confidentialité"
            onPress={() => Linking.openURL(URL_CONFIDENTIALITE)}
          />
          <LigneLien
            label="Conditions d'utilisation"
            onPress={() => Linking.openURL(URL_CGU)}
          />
          <View style={[styles.ligne, styles.ligneDerniere]}>
            <Text style={styles.ligneLabel}>{"Version de l'app"}</Text>
            <Text style={styles.version}>v{version}</Text>
          </View>
        </View>

        {/* ZONE DANGEREUSE */}
        <Text style={styles.sectionTitle}>Zone dangereuse</Text>
        <TouchableOpacity
          style={styles.boutonSupprimer}
          onPress={supprimer}
          accessibilityRole="button"
        >
          <Text style={styles.boutonSupprimerTexte}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function LigneLien({
  label,
  onPress,
  dernier,
}: {
  label: string;
  onPress: () => void;
  dernier?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.ligne, dernier && styles.ligneDerniere]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.ligneLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function LigneSwitch({
  label,
  valeur,
  onChange,
  dernier,
}: {
  label: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
  dernier?: boolean;
}) {
  return (
    <View style={[styles.ligne, dernier && styles.ligneDerniere]}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <Switch
        value={valeur}
        onValueChange={onChange}
        trackColor={{ true: Colors.corail[600], false: Colors.fondGris }}
        thumbColor={Colors.blanc}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 60,
  },
  retour: {
    fontSize: 15,
    color: Colors.petrole[500],
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.grisMoyen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fondNeutre,
  },
  ligneDerniere: {
    borderBottomWidth: 0,
  },
  ligneLabel: {
    fontSize: 15,
    color: Colors.aubergine,
    flex: 1,
  },
  chevron: {
    fontSize: 18,
    color: Colors.grisMoyen,
  },
  version: {
    fontSize: 14,
    color: Colors.grisMoyen,
  },
  boutonSupprimer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.deconnexion[500],
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  boutonSupprimerTexte: {
    color: Colors.deconnexion[500],
    fontWeight: '700',
  },
});
