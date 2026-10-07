import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from '../../services/notifications.service';

// 📖 "2026-10-08T09:00:00Z" → "8 oct." / aujourd'hui → "09h00". Pas de contrat
// d'affichage figé encore : on distingue juste aujourd'hui du reste pour que la
// liste reste lisible sans date absolue sur les notifs toutes fraîches.
const formatDate = (iso: string) => {
  const date = new Date(iso);
  const aujourdhui = new Date();
  const estAujourdhui = date.toDateString() === aujourdhui.toDateString();

  return estAujourdhui
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, loading, error, marquerLue, marquerToutesLues } = useNotifications();

  const aDesNonLues = notifications?.some((n) => !n.lue) ?? false;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.retour}>← Notifications</Text>
        </TouchableOpacity>

        {aDesNonLues && (
          <TouchableOpacity onPress={marquerToutesLues} accessibilityRole="button">
            <Text style={styles.toutLire}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && error && (
        <Text style={styles.errorText}>Impossible de charger vos notifications.</Text>
      )}

      {!loading && !error && notifications && (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationRow notification={item} onPress={() => marquerLue(item.id)} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Vous n&apos;avez aucune notification pour l&apos;instant.</Text>
          }
        />
      )}
    </View>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: NotificationItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !notification.lue && styles.rowNonLue]}
      onPress={onPress}
      disabled={notification.lue}
      accessibilityRole="button"
    >
      {!notification.lue && <View style={styles.pastille} />}

      <View style={styles.rowCentre}>
        <Text style={styles.rowTitre}>{notification.titre}</Text>
        <Text style={styles.rowCorps}>{notification.corps}</Text>
      </View>

      <Text style={styles.rowDate}>{formatDate(notification.date)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  retour: {
    fontSize: 15,
    color: Colors.petrole[500],
    fontWeight: '600',
  },
  toutLire: {
    fontSize: 13,
    color: Colors.corail[600],
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fondNeutre,
  },
  rowNonLue: {
    backgroundColor: Colors.fondNeutre,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  pastille: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.corail[600],
    marginTop: 6,
    marginRight: 10,
  },
  rowCentre: {
    flex: 1,
    marginRight: 10,
  },
  rowTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  rowCorps: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginTop: 2,
  },
  rowDate: {
    fontSize: 11,
    color: Colors.grisMoyen,
  },
  empty: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
