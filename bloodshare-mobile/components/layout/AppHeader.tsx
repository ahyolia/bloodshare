import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useProfil } from '../../hooks/useProfil';
import { NiveauModal } from './NiveauModal';

type AppHeaderProps = {
  /** Titre affiché à gauche (ex. "Quiz", "Don", "Cartes"). */
  title: string;
  /** Pilule de points → ouvre la modale de progression. Défaut : true. */
  showPoints?: boolean;
  /** Icône cloche de notifications. Défaut : true. */
  showNotifications?: boolean;
  /** Avatar (initiale du pseudo) → page Profil. Défaut : true. */
  showAvatar?: boolean;
  /**
   * Action au tap sur la cloche. Tant qu'il n'y a pas d'écran Notifications,
   * l'écran parent décide (ouvrir un panneau, naviguer…). Sans handler, la
   * cloche est décorative.
   */
  onNotificationsPress?: () => void;
};

// 📖 Header applicatif réutilisable, identique en apparence sur tous les onglets
// mais configurable écran par écran via les props `show*`. Il charge lui-même le
// profil (points + niveau + pseudo) : les écrans n'ont plus à s'en occuper pour
// le header. À poser en premier enfant du ScrollView de chaque écran.
export function AppHeader({
  title,
  showPoints = true,
  showNotifications = true,
  showAvatar = true,
  onNotificationsPress,
}: AppHeaderProps) {
  const router = useRouter();
  const { profil } = useProfil();
  const [modalVisible, setModalVisible] = useState(false);

  const points = profil?.points_cumules ?? 0;
  const initiale = profil?.pseudo ? profil.pseudo.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.right}>
        {showPoints && (
          <TouchableOpacity
            style={styles.pointsBadge}
            onPress={() => setModalVisible(true)}
            disabled={!profil}
            accessibilityRole="button"
            accessibilityLabel={`${points} points, voir ma progression`}
          >
            <Text style={styles.pointsBadgeText}>{points} ★</Text>
          </TouchableOpacity>
        )}

        {showNotifications && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            disabled={!onNotificationsPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications" size={22} color={Colors.aubergine} />
          </TouchableOpacity>
        )}

        {showAvatar && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/tabs/profil')}
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
          >
            <Text style={styles.avatarText}>{initiale}</Text>
          </TouchableOpacity>
        )}
      </View>

      {profil && (
        <NiveauModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          profil={profil}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsBadge: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsBadgeText: {
    color: Colors.aubergine,
    fontSize: 13,
    fontWeight: '700',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.petrole[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.blanc,
    fontSize: 14,
    fontWeight: '700',
  },
});
