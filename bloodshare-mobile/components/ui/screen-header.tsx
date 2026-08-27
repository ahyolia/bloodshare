import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { getProfil } from '../../services/profil.service';

type Props = {
  /** Titre affiché à gauche (ex. "Cartes", "Don", "Quiz"). */
  title: string;
  /** Action de la cloche. Optionnelle tant que les notifications ne sont pas branchées. */
  onBellPress?: () => void;
};

/**
 * 📖 Header commun des écrans d'onglet : titre + badge points + cloche + accès au profil.
 * Il récupère lui-même les points (getProfil) pour éviter de dupliquer cet appel dans chaque
 * écran. L'avatar renvoie vers l'onglet Profil.
 */
export function ScreenHeader({ title, onBellPress }: Props) {
  const router = useRouter();
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getProfil()
      .then((profil) => {
        if (!cancelled) setPoints(profil.points_cumules ?? 0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.right}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>{points ?? '–'} ★</Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBellPress}
          disabled={!onBellPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications" size={18} color={Colors.aubergine} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/tabs/profil')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voir mon profil"
        >
          <Ionicons name="person" size={18} color={Colors.blanc} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    // 📖 Reprend la teinte des badges points existants (don / cartes). À remplacer par un
    //    token de palette (ex. Colors.fondGris) quand il sera ajouté à constants/colors.ts.
    backgroundColor: '#E8E4E6',
  },
  pointsBadgeText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 12,
  },
  iconButton: {
    marginLeft: 10,
  },
  avatar: {
    marginLeft: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.petrole[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
