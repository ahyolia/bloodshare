import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import {
  BADGES_INFO,
  BadgeInfo,
  CATEGORIE_COLOR,
  CATEGORIE_LABEL,
  CATEGORIES_FILTRE,
  CategorieBadge,
} from '../../../constants/badges';
import { Badge, getBadges } from '../../../services/badges.service';

// 📖 Repli si un badge existe en base (BO) mais pas encore dans BADGES_INFO : l'écran
//    affiche quand même quelque chose de cohérent plutôt qu'un `undefined` qui plante
//    l'accès à `info.categorie` un peu partout ci-dessous.
const INFO_PAR_DEFAUT: BadgeInfo = {
  emoji: '🏅',
  categorie: 'dons',
  description: 'Un nouveau badge à découvrir.',
  condition: 'Continuez à utiliser BloodShare pour le débloquer.',
};

const infoDe = (nom: string): BadgeInfo => BADGES_INFO[nom] ?? INFO_PAR_DEFAUT;

export default function BadgesScreen() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtreActif, setFiltreActif] = useState<'tous' | CategorieBadge>('tous');
  const [badgeSelectionne, setBadgeSelectionne] = useState<Badge | null>(null);

  useEffect(() => {
    let cancelled = false;

    getBadges()
      .then((data) => {
        if (cancelled) return;
        // Badges obtenus en premier : ce qu'on a déjà accompli passe avant ce qui reste à faire.
        const tries = [...data.filter((b) => b.obtenu), ...data.filter((b) => !b.obtenu)];
        setBadges(tries);
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

  const badgesFiltres =
    filtreActif === 'tous' ? badges : badges.filter((b) => infoDe(b.nom).categorie === filtreActif);

  const nbObtenus = badges.filter((b) => b.obtenu).length;

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.header}
        accessibilityRole="button"
      >
        <Text style={styles.retour}>← Mes badges</Text>
        {!loading && !error && (
          <Text style={styles.sousTitre}>
            {nbObtenus}/{badges.length} badges obtenus
          </Text>
        )}
      </TouchableOpacity>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && error && (
        <Text style={styles.errorText}>Impossible de charger vos badges.</Text>
      )}

      {!loading && !error && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtres}
          >
            <Pill
              label="Tous"
              active={filtreActif === 'tous'}
              onPress={() => setFiltreActif('tous')}
            />
            {CATEGORIES_FILTRE.map((categorie) => (
              <Pill
                key={categorie}
                label={CATEGORIE_LABEL[categorie]}
                active={filtreActif === categorie}
                onPress={() => setFiltreActif(categorie)}
              />
            ))}
          </ScrollView>

          <FlatList
            data={badgesFiltres}
            numColumns={3}
            keyExtractor={(item) => item.id.toString()}
            columnWrapperStyle={styles.ligne}
            contentContainerStyle={styles.grille}
            renderItem={({ item }) => (
              <BadgeTuile badge={item} onPress={() => setBadgeSelectionne(item)} />
            )}
          />
        </>
      )}

      <Modal
        visible={badgeSelectionne !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setBadgeSelectionne(null)}
      >
        <TouchableOpacity
          style={styles.modaleFond}
          activeOpacity={1}
          onPress={() => setBadgeSelectionne(null)}
        >
          {badgeSelectionne && (
            <TouchableOpacity activeOpacity={1} style={styles.modaleCard}>
              <DetailBadge badge={badgeSelectionne} />
              <TouchableOpacity
                style={styles.boutonFermer}
                onPress={() => setBadgeSelectionne(null)}
                accessibilityRole="button"
              >
                <Text style={styles.boutonFermerTexte}>Fermer</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
      accessibilityRole="button"
    >
      <Text style={active ? styles.pillTexteActif : styles.pillTexteInactif}>{label}</Text>
    </TouchableOpacity>
  );
}

function BadgeTuile({ badge, onPress }: { badge: Badge; onPress: () => void }) {
  const info = infoDe(badge.nom);

  return (
    <TouchableOpacity
      style={[styles.tuile, badge.obtenu ? styles.tuileObtenue : styles.tuileVerrouillee]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.tuileEmoji, !badge.obtenu && styles.tuileEmojiVerrouille]}>
        {info.emoji}
      </Text>
      <Text
        style={badge.obtenu ? styles.tuileNomObtenu : styles.tuileNomVerrouille}
        numberOfLines={2}
      >
        {badge.nom}
      </Text>

      {badge.obtenu ? (
        <View
          style={[styles.pastille, { backgroundColor: CATEGORIE_COLOR[info.categorie] }]}
        />
      ) : (
        <Text style={styles.cadenas}>🔒</Text>
      )}
    </TouchableOpacity>
  );
}

function DetailBadge({ badge }: { badge: Badge }) {
  const info = infoDe(badge.nom);
  const couleur = CATEGORIE_COLOR[info.categorie];

  return (
    <>
      <View
        style={[
          styles.detailPastille,
          { backgroundColor: badge.obtenu ? `${couleur}26` : Colors.fondGris },
        ]}
      >
        <Text style={[styles.detailEmoji, !badge.obtenu && styles.detailEmojiVerrouille]}>
          {info.emoji}
        </Text>
        {!badge.obtenu && <Text style={styles.detailCadenas}>🔒</Text>}
      </View>

      <Text style={styles.detailTitre}>{badge.nom}</Text>

      <View style={[styles.detailPillCategorie, { backgroundColor: `${couleur}26` }]}>
        <Text style={styles.detailPillCategorieTexte}>{CATEGORIE_LABEL[info.categorie]}</Text>
      </View>

      <View style={styles.detailSeparateur} />

      <Text style={styles.detailSectionTitre}>🎯 Comment l'obtenir ?</Text>
      <Text style={styles.detailCondition}>{info.condition}</Text>

      <Text style={styles.detailDescription}>{info.description}</Text>

      {badge.obtenu && badge.obtenu_at ? (
        <>
          <Text style={styles.detailObtenuTitre}>✅ Débloqué le</Text>
          <Text style={styles.detailObtenuDate}>
            {new Date(badge.obtenu_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </>
      ) : (
        <View style={styles.detailEncouragement}>
          <Text style={styles.detailEncouragementTexte}>
            💡 Continuez à donner et à participer pour débloquer ce badge !
          </Text>
        </View>
      )}
    </>
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
    marginBottom: 8,
  },
  retour: {
    fontSize: 15,
    color: Colors.petrole[500],
    fontWeight: '600',
  },
  sousTitre: {
    fontSize: 14,
    color: Colors.grisMoyen,
    marginTop: 4,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 40,
  },
  filtres: {
    paddingHorizontal: 18,
    gap: 8,
    paddingBottom: 12,
  },
  pill: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pillActive: {
    backgroundColor: Colors.aubergine,
  },
  pillInactive: {
    backgroundColor: Colors.blanc,
    borderWidth: 1,
    borderColor: Colors.fondGris,
  },
  pillTexteActif: {
    color: Colors.blanc,
    fontWeight: '600',
    fontSize: 13,
  },
  pillTexteInactif: {
    color: Colors.grisMoyen,
    fontWeight: '600',
    fontSize: 13,
  },
  grille: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  ligne: {
    gap: 12,
  },
  tuile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  tuileObtenue: {
    backgroundColor: Colors.blanc,
    elevation: 3,
    shadowColor: Colors.aubergine,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tuileVerrouillee: {
    backgroundColor: Colors.fondGris,
  },
  tuileEmoji: {
    fontSize: 32,
  },
  tuileEmojiVerrouille: {
    opacity: 0.3,
  },
  tuileNomObtenu: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
    marginTop: 6,
  },
  tuileNomVerrouille: {
    fontSize: 11,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginTop: 6,
  },
  pastille: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cadenas: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 12,
    color: Colors.grisMoyen,
  },
  modaleFond: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modaleCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    backgroundColor: Colors.blanc,
    alignItems: 'center',
  },
  detailPastille: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmoji: {
    fontSize: 40,
  },
  detailEmojiVerrouille: {
    opacity: 0.4,
  },
  detailCadenas: {
    position: 'absolute',
    fontSize: 28,
  },
  detailTitre: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
    marginTop: 12,
  },
  detailPillCategorie: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  detailPillCategorieTexte: {
    fontSize: 12,
    color: Colors.aubergine,
  },
  detailSeparateur: {
    height: 1,
    backgroundColor: Colors.fondGris,
    marginVertical: 16,
    alignSelf: 'stretch',
  },
  detailSectionTitre: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.grisMoyen,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  detailCondition: {
    fontSize: 15,
    color: Colors.aubergine,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 14,
    color: Colors.grisMoyen,
    lineHeight: 20,
    fontStyle: 'italic',
    alignSelf: 'flex-start',
  },
  detailObtenuTitre: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.petrole[500],
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  detailObtenuDate: {
    fontSize: 15,
    color: Colors.aubergine,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  detailEncouragement: {
    backgroundColor: Colors.creme,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  detailEncouragementTexte: {
    fontSize: 13,
    color: Colors.grisMoyen,
    textAlign: 'center',
  },
  boutonFermer: {
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  boutonFermerTexte: {
    color: Colors.blanc,
    fontWeight: '700',
    textAlign: 'center',
  },
});
