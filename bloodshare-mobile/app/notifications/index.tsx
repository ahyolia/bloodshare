import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Bouton } from '../../components/ui/Bouton';
import { Chargement } from '../../components/ui/Chargement';
import { EnTeteSousPage } from '../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../components/ui/EtatErreur';
import { EtatVide } from '../../components/ui/EtatVide';
import { Groupe, Separateur } from '../../components/ui/Groupe';
import { entreeSousPage } from '../../constants/animations';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE, type TeintePastille } from '../../constants/teintes';
import { Typo } from '../../constants/typography';
import { useNotifications } from '../../hooks/useNotifications';
import type { CategorieNotification, NotificationItem } from '../../services/notifications.service';

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

type Icone = ComponentProps<typeof Ionicons>['name'];

// 📖 Icône et teinte de pastille par catégorie (renvoyée par l'API). Record<…> : une
//    catégorie ajoutée à l'union oblige à compléter cette table.
const META_CATEGORIE: Record<CategorieNotification, { icone: Icone; teinte: TeintePastille }> = {
  badge: { icone: 'ribbon-outline', teinte: 'orange' },
  niveau: { icone: 'trending-up-outline', teinte: 'mousse' },
  quiz: { icone: 'school-outline', teinte: 'petrole' },
  defi: { icone: 'flag-outline', teinte: 'mousse' },
  evenement: { icone: 'calendar-outline', teinte: 'petrole' },
  don: { icone: 'water-outline', teinte: 'corail' },
  alerte: { icone: 'alert-circle-outline', teinte: 'corail' },
  parrainage: { icone: 'people-outline', teinte: 'orange' },
  carte: { icone: 'albums-outline', teinte: 'petrole' },
  autre: { icone: 'notifications-outline', teinte: 'petrole' },
};

type Section = { cle: 'nouvelles' | 'lues'; titre: string; items: NotificationItem[] };

export default function NotificationsScreen() {
  const { notifications, loading, chargementSuite, error, marquerLue, marquerToutesLues, chargerPlus, recharger } =
    useNotifications();

  const enTete = <EnTeteSousPage titre="Notifications" />;

  if (loading || error || !notifications) {
    return (
      <View style={[styles.screen, styles.content]}>
        {enTete}
        {loading && <Chargement message="On récupère tes notifications…" />}
        {!loading && error && <EtatErreur onReessayer={recharger} />}
      </View>
    );
  }

  // 📖 Deux cartes au plus : les nouvelles (à toucher pour les lire), puis les déjà
  //    lues. L'API trie déjà du plus récent au plus ancien.
  const sections = (
    [
      { cle: 'nouvelles', titre: 'Nouvelles', items: notifications.filter((n) => !n.lue) },
      { cle: 'lues', titre: 'Déjà lues', items: notifications.filter((n) => n.lue) },
    ] satisfies Section[]
  ).filter((s) => s.items.length > 0);

  return (
    <View style={styles.screen}>
      <FlatList
        data={sections}
        keyExtractor={(s) => s.cle}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={enTete}
        renderItem={({ item }) => (
          <SectionNotifications section={item} onLire={marquerLue} onToutLire={marquerToutesLues} />
        )}
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

/**
 * 📖 Surélevé = interactif : les nouvelles se touchent (elles passent en lues), leur
 *    carte flotte. Les lues n'ont plus d'action : carte à plat, contour fin.
 *    « Tout marquer comme lu » vit sur la ligne du titre « Nouvelles » : il agit sur
 *    cette section, et n'existe donc que lorsqu'elle est affichée.
 */
function SectionNotifications({
  section,
  onLire,
  onToutLire,
}: {
  section: Section;
  onLire: (id: string) => void;
  onToutLire: () => void;
}) {
  return (
    <Animated.View entering={entreeSousPage}>
      <View style={styles.sectionEnTete} testID={`en-tete-${section.cle}`}>
        <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
          {section.titre}
        </Text>
        {section.cle === 'nouvelles' && (
          <Bouton
            variante="discret"
            libelle="Tout marquer comme lu"
            icone="checkmark-done-outline"
            onPress={onToutLire}
          />
        )}
      </View>
      <Groupe variante={section.cle === 'nouvelles' ? 'interactif' : 'info'}>
        {section.items.map((notification, i) => (
          <View key={notification.id}>
            {i > 0 && <Separateur />}
            <LigneNotification notification={notification} onPress={() => onLire(notification.id)} />
          </View>
        ))}
      </Groupe>
    </Animated.View>
  );
}

/**
 * 📖 Une lue garde sa pastille colorée (on reconnaît son type d'un coup d'œil), mais
 *    son titre passe en graisse normale et en aubergine 500 (6:1 sur la carte) :
 *    adouci par la couleur, pas par la transparence, qui passerait sous les 4,5:1.
 */
function LigneNotification({ notification, onPress }: { notification: NotificationItem; onPress: () => void }) {
  const nonLue = !notification.lue;
  const meta = META_CATEGORIE[notification.categorie];
  const teinte = TEINTES_PASTILLE[meta.teinte];

  return (
    <Pressable
      onPress={onPress}
      disabled={!nonLue}
      accessibilityRole="button"
      accessibilityLabel={`${nonLue ? 'Non lue. ' : ''}${notification.titre}. ${notification.corps}`}
      accessibilityHint={nonLue ? 'Marque la notification comme lue' : undefined}
      accessibilityState={{ disabled: !nonLue }}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}
    >
      <View style={[styles.pastille, { backgroundColor: teinte.fond }]}>
        <Ionicons name={meta.icone} size={20} color={teinte.icone} />
      </View>

      <View style={styles.textes}>
        <View style={styles.titreLigne}>
          <Text style={[nonLue ? Typo.corpsFort : Typo.corps, styles.titre, !nonLue && styles.titreLu]} numberOfLines={2}>
            {notification.titre}
          </Text>
          <Text style={[Typo.legende, styles.date]}>{formatDate(notification.date)}</Text>
        </View>
        <Text style={[Typo.legende, styles.corps]}>{notification.corps}</Text>
      </View>

      {/* 📖 Le point ne porte pas l'info seul : « Non lue » est dans le libellé. */}
      {nonLue && <View style={styles.point} />}
    </Pressable>
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
  // 📖 Titre et bouton sur une ligne ; flexWrap : sur un écran étroit (ou un texte
  //    agrandi), le bouton passe sous le titre au lieu de déborder.
  sectionEnTete: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: Espace[2],
    marginTop: Espace[4],
    marginBottom: Espace[3],
  },
  sectionTitre: {
    color: Theme.texte.principal,
  },
  // 📖 Marge de 16 + pastille de 40 + écart de 12 : le filet de `Separateur` démarre
  //    sous le texte, comme dans les autres groupes.
  ligne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[3],
    padding: Espace[4],
  },
  presse: {
    opacity: 0.85,
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  titreLu: {
    color: Theme.texte.secondaire,
  },
  date: {
    color: Theme.texte.secondaire,
  },
  corps: {
    color: Theme.texte.secondaire,
  },
  // Pastille corail posée sur le coin haut gauche de l'icône.
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
