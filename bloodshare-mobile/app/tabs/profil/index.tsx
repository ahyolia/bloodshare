import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useProfilComplet } from '../../../hooks/useProfilComplet';
import { logout } from '../../../services/auth.service';
import { removeToken } from '../../../stores/auth.store';
import { LIBELLE_STATUT_DONNEUR, initialePseudo } from '../../../utils/profil';

export default function ProfilScreen() {
  const router = useRouter();
  const { apercu, profil, dons, badges, loading, error, reload } = useProfilComplet();

  // 📖 useFocusEffect (et pas useEffect) : l'écran Profil reste monté quand on
  //    ouvre "Informations personnelles". Au retour, on veut le pseudo/l'avatar
  //    à jour → on recharge à chaque fois que l'écran (re)prend le focus.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleLogout = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            // 📖 Même si l'appel /auth/logout échoue (réseau coupé), on purge
            //    le token local : l'utilisateur doit pouvoir se déconnecter.
          }
          await removeToken();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  // 📖 On peint dès qu'on a une info : le profil frais, sinon l'aperçu du cache.
  const pseudo = profil?.pseudo ?? apercu?.pseudo ?? '';
  const avatarUrl = profil?.avatar_url ?? apercu?.avatar_url ?? null;

  const rienAAfficher = !profil && !apercu;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading && rienAAfficher && (
          <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />
        )}

        {error && rienAAfficher && (
          <Text style={styles.errorText}>Impossible de charger votre profil.</Text>
        )}

        {!rienAAfficher && (
          <>
            {/* CARTE UTILISATEUR — sert de header, pas de titre "Profil" */}
            <View style={styles.userCard}>
              <View style={styles.userRow}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>{initialePseudo(pseudo)}</Text>
                  </View>
                )}

                <View style={styles.userInfo}>
                  <Text style={styles.pseudo}>{pseudo}</Text>
                  {profil?.statut_donneur && (
                    <Text style={styles.statut}>
                      {LIBELLE_STATUT_DONNEUR[profil.statut_donneur]}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.modifierPill}
                  onPress={() => router.push('/tabs/profil/informations')}
                  accessibilityRole="button"
                >
                  <Text style={styles.modifierPillText}>Modifier ✏️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* NIVEAU ET POINTS */}
            {profil && (
              <View style={styles.niveauCard}>
                <View style={styles.niveauRow}>
                  <View style={styles.niveauGauche}>
                    <Text style={styles.niveauTitre}>
                      Niveau {profil.niveau.niveau} — {profil.niveau.label}
                    </Text>
                    <Text style={styles.niveauSousTitre}>
                      {profil.points_cumules} points cumulés
                    </Text>
                  </View>
                  <View style={styles.niveauBulle}>
                    <Text style={styles.niveauBulleTexte}>{profil.niveau.niveau}</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${profil.niveau.progression}%` }]}
                  />
                </View>

                <Text style={styles.progressLabel}>
                  {profil.niveau.points_prochain_niveau !== null
                    ? `${profil.points_cumules}/${profil.niveau.points_prochain_niveau} pts`
                    : 'Niveau maximum atteint 🎉'}
                </Text>
              </View>
            )}

            {/* SECTION MON ACTIVITÉ */}
            <Text style={styles.sectionTitle}>Mon activité</Text>
            <View style={styles.sectionCard}>
              <SettingsRow
                emoji="🩸"
                fond={Colors.fondRose}
                label="Historique des dons"
                valeur={dons ? `${dons.total_dons} dons` : undefined}
                onPress={() => router.push('/tabs/profil/historique-dons')}
              />
              <SettingsRow
                emoji="🏆"
                fond={Colors.fondRose}
                label="Mes badges"
                valeur={badges ? `${badges.obtenus}/${badges.total}` : undefined}
                onPress={() => router.push('/tabs/cartes')}
              />
              <SettingsRow
                emoji="⭐"
                fond={Colors.fondBleu}
                label="Points et niveau"
                onPress={() => router.push('/tabs/profil/points')}
              />
              <SettingsRow
                emoji="🤝"
                fond={Colors.fondVert}
                label="Parrainage"
                onPress={() => router.push('/tabs/profil/parrainage')}
                dernier
              />
            </View>

            {/* SECTION PARAMÈTRES */}
            <Text style={styles.sectionTitle}>Paramètres</Text>
            <View style={styles.sectionCard}>
              <SettingsRow
                emoji="⚙️"
                fond={Colors.fondGris}
                label="Paramètres du compte"
                onPress={() => router.push('/tabs/profil/parametres')}
              />
              <SettingsRow
                emoji="🔔"
                fond={Colors.fondGris}
                label="Notifications"
                onPress={() => router.push('/tabs/profil/parametres')}
                dernier
              />
            </View>

            {/* DANGER ZONE — sans titre */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              accessibilityRole="button"
            >
              <Text style={styles.logoutButtonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  emoji,
  fond,
  label,
  valeur,
  onPress,
  dernier,
}: {
  emoji: string;
  fond: string;
  label: string;
  valeur?: string;
  onPress: () => void;
  dernier?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, dernier && styles.rowDernier]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.rowIcon, { backgroundColor: fond }]}>
        <Text style={styles.rowIconEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {valeur ? <Text style={styles.rowValeur}>{valeur}</Text> : null}
      <Text style={styles.rowChevron}>›</Text>
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

  userCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: Colors.petrole[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.blanc,
    fontSize: 24,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  pseudo: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  statut: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginTop: 2,
  },
  modifierPill: {
    borderWidth: 1,
    borderColor: Colors.petrole[500],
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modifierPillText: {
    color: Colors.petrole[500],
    fontSize: 12,
    fontWeight: '600',
  },

  niveauCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  niveauRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  niveauGauche: {
    flex: 1,
    paddingRight: 12,
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
  niveauBulle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.corail[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  niveauBulleTexte: {
    color: Colors.blanc,
    fontSize: 20,
    fontWeight: '700',
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

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.grisMoyen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fondNeutre,
  },
  rowDernier: {
    borderBottomWidth: 0,
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
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.aubergine,
  },
  rowValeur: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginRight: 8,
  },
  rowChevron: {
    fontSize: 18,
    color: Colors.grisMoyen,
  },

  logoutButton: {
    backgroundColor: Colors.blanc,
    borderWidth: 1.5,
    borderColor: Colors.corail[600],
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: Colors.corail[600],
    fontWeight: '700',
  },
});
