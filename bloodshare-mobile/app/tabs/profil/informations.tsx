import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import {
  AVATARS,
  getProfil,
  StatutDonneur,
  updateProfil,
} from '../../../services/profil.service';
import { saveUser, getUser } from '../../../stores/auth.store';
import { OPTIONS_STATUT_DONNEUR, initialePseudo } from '../../../utils/profil';

export default function InformationsScreen() {
  const router = useRouter();

  // 📖 "Controlled input" : la valeur affichée par le TextInput vient TOUJOURS
  //    du state React (value={pseudo}), et chaque frappe passe par
  //    onChangeText={setPseudo}. React est l'unique source de vérité — on peut
  //    valider, tronquer ou formater la saisie avant qu'elle ne s'affiche.
  //    Sans `value`, l'input serait "uncontrolled" : le natif garderait sa
  //    propre valeur, impossible à lire de façon fiable au moment du submit.
  const [pseudo, setPseudo] = useState('');
  const [avatarId, setAvatarId] = useState<number | null>(null);
  const [statut, setStatut] = useState<StatutDonneur>('jamais_donne');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // 📖 On pré-remplit les champs avec les valeurs actuelles : l'utilisateur
  //    modifie un profil existant, il ne le recrée pas. Un formulaire vide
  //    l'obligerait à ressaisir son pseudo pour changer juste l'avatar, et un
  //    envoi accidentel écraserait ses données par du vide.
  useEffect(() => {
    let cancelled = false;

    getProfil()
      .then((p) => {
        if (cancelled) return;
        setPseudo(p.pseudo);
        setAvatarId(p.avatar_id);
        if (p.statut_donneur) setStatut(p.statut_donneur);
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

  const enregistrer = async () => {
    if (pseudo.trim().length === 0) {
      Alert.alert('Pseudo requis', 'Merci de saisir un pseudo.');
      return;
    }

    setSaving(true);
    try {
      const frais = await updateProfil({
        pseudo: pseudo.trim(),
        avatar_id: avatarId,
        statut_donneur: statut,
      });

      // 📖 On répercute dans le SecureStore pour que l'AppHeader et l'écran
      //    Profil affichent la nouvelle valeur sans attendre un rechargement.
      const cache = await getUser();
      await saveUser({
        ...(cache ?? {}),
        pseudo: frais.pseudo,
        avatar_url: frais.avatar_url,
        statut_donneur: frais.statut_donneur,
      });

      router.back();
    } catch {
      Alert.alert('Erreur', "L'enregistrement a échoué. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Informations personnelles</Text>

        {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

        {!loading && error && (
          <Text style={styles.errorText}>Impossible de charger vos informations.</Text>
        )}

        {!loading && !error && (
          <>
            {/* AVATAR */}
            <Text style={styles.label}>Avatar</Text>
            <View style={styles.avatarRow}>
              {AVATARS.map((a) => {
                const actif = a.id === avatarId;
                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setAvatarId(a.id)}
                    style={[styles.avatar, actif ? styles.avatarActif : styles.avatarInactif]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: actif }}
                  >
                    {a.image_url ? (
                      <Image source={{ uri: a.image_url }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarInitiale}>{initialePseudo(pseudo)}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PSEUDO */}
            <Text style={styles.label}>Pseudo</Text>
            <TextInput
              style={styles.input}
              value={pseudo}
              onChangeText={setPseudo}
              placeholder="Votre pseudo"
              placeholderTextColor={Colors.grisMoyen}
              maxLength={50}
            />

            {/* STATUT DONNEUR */}
            <Text style={styles.label}>Statut donneur</Text>
            {OPTIONS_STATUT_DONNEUR.map((opt) => {
              const actif = opt.valeur === statut;
              return (
                <TouchableOpacity
                  key={opt.valeur}
                  style={[styles.radio, actif && styles.radioActif]}
                  onPress={() => setStatut(opt.valeur)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: actif }}
                >
                  <Text style={styles.radioPuce}>{actif ? '◉' : '○'}</Text>
                  <Text style={styles.radioLabel}>{opt.libelle}</Text>
                </TouchableOpacity>
              );
            })}

            {/* ENREGISTRER */}
            <TouchableOpacity
              style={[styles.bouton, saving && styles.boutonDesactive]}
              onPress={enregistrer}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={Colors.blanc} />
              ) : (
                <Text style={styles.boutonTexte}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    marginTop: 8,
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.grisMoyen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.petrole[500],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarActif: {
    borderWidth: 3,
    borderColor: Colors.corail[600],
    transform: [{ scale: 1.08 }],
  },
  avatarInactif: {
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitiale: {
    color: Colors.blanc,
    fontSize: 22,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.aubergine,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.fondNeutre,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  radioActif: {
    borderColor: Colors.corail[600],
    backgroundColor: Colors.fondRose,
  },
  radioPuce: {
    fontSize: 16,
    color: Colors.corail[600],
    marginRight: 10,
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.aubergine,
    flex: 1,
  },
  bouton: {
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  boutonDesactive: {
    opacity: 0.6,
  },
  boutonTexte: {
    color: Colors.blanc,
    fontWeight: '700',
    fontSize: 16,
  },
});
