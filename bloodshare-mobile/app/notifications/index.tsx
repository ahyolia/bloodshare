import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Bouton } from '../../components/ui/Bouton';
import { Chargement } from '../../components/ui/Chargement';
import { EnTeteSousPage } from '../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../components/ui/EtatErreur';
import { EtatVide } from '../../components/ui/EtatVide';
import { entreeSousPage } from '../../constants/animations';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from '../../services/notifications.service';

// 📖 "2026-10-08T09:00:00Z" → "8 oct." / aujourd'hui → "09:00". On distingue juste
//    aujourd'hui du reste pour que la liste reste lisible sans date absolue sur les
//    notifs toutes fraîches.
const formatDate = (iso: string) => {
  const date = new Date(iso);
  const estAujourdhui = date.toDateString() === new Date().toDateString();

  return estAujourdhui
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function NotificationsScreen() {
  const { notifications, loading, chargementSuite, error, marquerLue, marquerToutesLues, chargerPlus, recharger } =
    useNotifications();

  const aDesNonLues = notifications?.some((n) => !n.lue) ?? false;

  const enTete = (
    <>
      <EnTeteSousPage titre="Notifications" />
      {aDesNonLues && (
        <Bouton
          variante="discret"
          libelle="Tout marquer comme lu"
          icone="checkmark-done-outline"
          onPress={marquerToutesLues}
          style={styles.toutLire}
        />
      )}
    </>
  );

  if (loading || error || !notifications) {
    return (
      <View style={[styles.screen, styles.content]}>
        {enTete}
        {loading && <Chargement message="On récupère tes notifications…" />}
        {!loading && error && <EtatErreur onReessayer={recharger} />}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={enTete}
        ItemSeparatorComponent={EspaceListe}
        renderItem={({ item }) => <LigneNotification notification={item} onPress={() => marquerLue(item.id)} />}
        onEndReached={chargerPlus}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EtatVide
            titre="Rien de neuf pour l'instant"
            message="Les rappels de don et les nouveautés d'Aïma apparaîtront ici."
          />
        }
        ListFooterComponent={
          chargementSuite ? <ActivityIndicator color={Theme.texte.secondaire} style={styles.chargementSuite} /> : null
        }
      />
    </View>
  );
}

function EspaceListe() {
  return <View style={styles.espace} />;
}

/**
 * 📖 Surélevé = interactif : une notification non lue se touche (elle passe en lue),
 *    elle flotte. Une fois lue, elle n'a plus d'action : à plat, texte adouci.
 */
function LigneNotification({ notification, onPress }: { notification: NotificationItem; onPress: () => void }) {
  const nonLue = !notification.lue;

  return (
    <Animated.View entering={entreeSousPage}>
      <Pressable
        onPress={onPress}
        disabled={!nonLue}
        accessibilityRole="button"
        accessibilityLabel={`${nonLue ? 'Non lue. ' : ''}${notification.titre}. ${notification.corps}`}
        accessibilityHint={nonLue ? 'Marque la notification comme lue' : undefined}
        accessibilityState={{ disabled: !nonLue }}
        style={({ pressed }) => [styles.ligne, nonLue ? styles.ligneNonLue : styles.ligneLue, pressed && styles.presse]}
      >
        <View style={[styles.pastille, nonLue ? styles.pastilleNonLue : styles.pastilleLue]}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={nonLue ? Theme.info.icone : Theme.texte.secondaire}
          />
        </View>

        <View style={styles.textes}>
          <View style={styles.titreLigne}>
            <Text style={[nonLue ? Typo.corpsFort : Typo.corps, styles.titre]} numberOfLines={2}>
              {notification.titre}
            </Text>
            <Text style={[Typo.legende, styles.date]}>{formatDate(notification.date)}</Text>
          </View>
          <Text style={[Typo.legende, styles.corps]}>{notification.corps}</Text>
        </View>

        {/* 📖 Le point ne porte pas l'info seul : « Non lue » est dans le libellé. */}
        {nonLue && <View style={styles.point} />}
      </Pressable>
    </Animated.View>
  );
}

const PASTILLE = 40;
const POINT = 10;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[12],
  },
  toutLire: {
    alignSelf: 'flex-end',
    marginTop: -Espace[4],
    marginBottom: Espace[2],
  },
  espace: {
    height: Espace[2],
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[3],
    padding: Espace[4],
    borderRadius: Rayon.lg,
  },
  ligneNonLue: {
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  ligneLue: {
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  presse: {
    opacity: 0.85,
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: PASTILLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilleNonLue: {
    backgroundColor: Theme.info.fond,
  },
  pastilleLue: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  textes: {
    flex: 1,
    gap: 2,
  },
  titreLigne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[2],
  },
  titre: {
    flex: 1,
    color: Theme.texte.principal,
  },
  date: {
    color: Theme.texte.secondaire,
  },
  corps: {
    color: Theme.texte.secondaire,
  },
  point: {
    position: 'absolute',
    top: Espace[3],
    left: Espace[3],
    width: POINT,
    height: POINT,
    borderRadius: POINT / 2,
    backgroundColor: Theme.marque.principal,
    borderWidth: 2,
    borderColor: Theme.fond.surface,
  },
  chargementSuite: {
    marginVertical: Espace[4],
  },
});
