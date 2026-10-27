import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { GrilleCartes } from '../../../components/cartes/GrilleCartes';
import { EnTete } from '../../../components/EnTete';
import { Chargement } from '../../../components/ui/Chargement';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { Filtres } from '../../../components/ui/Filtres';
import { entree } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { Espace, Ombre, Rayon } from '../../../constants/spacing';
import { Palette } from '../../../constants/palette';
import { Typo } from '../../../constants/typography';
import { useNotificationsNonLues } from '../../../hooks/useNotificationsNonLues';
import { useProfil } from '../../../hooks/useProfil';
import { useRelanceOnglet } from '../../../hooks/useRelanceOnglet';
import { Cartes, getCartes, getCartesCache } from '../../../services/cartes.service';
import { getNomMois } from '../../../utils/mois';
import { compter } from '../../../utils/pluriel';
import { initialePseudo } from '../../../utils/profil';

const MARGE = Espace[4];

export default function CartesScreen() {
  // Appui sur l'onglet : retour en haut de la page et animations d'entrée rejouées.
  const cleOnglet = useRelanceOnglet('cartes');
  const router = useRouter();
  // 📖 <EnTete /> ne charge rien : l'écran lui fournit pseudo + points.
  const { profil } = useProfil();
  const notificationsNonLues = useNotificationsNonLues();
  const [cartes, setCartes] = useState<Cartes | null>(getCartesCache());
  const [loading, setLoading] = useState(!getCartesCache());
  const [error, setError] = useState(false);

  // 📖 useFocusEffect et pas useEffect : l'onglet Cartes reste monté en arrière-plan, donc
  //    un useEffect ne se relancerait pas quand on y revient après un scan → la carte
  //    fraîchement obtenue n'apparaîtrait qu'après un rechargement de l'app.
  //    Au rechargement, on garde les données déjà affichées si le réseau échoue
  //    (getCartesCache() n'est renseigné que par un chargement réussi).
  const charger = useCallback(() => {
    let cancelled = false;

    getCartes()
      .then((data) => {
        if (cancelled) return;
        setCartes(data);
        setError(false);
      })
      .catch(() => {
        if (!cancelled && !getCartesCache()) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(charger);

  const ouvrirCarte = (id: number) => router.push({ pathname: '/tabs/cartes/[id]', params: { id } });
  // 📖 Une collection de cartes du mois par année. Par défaut l'année en cours (la
  //    première de la liste) ; les années passées n'apparaissent que si le donneur y a
  //    au moins une carte.
  const [anneeChoisie, setAnneeChoisie] = useState<number | null>(null);
  const collectionsMois = cartes?.mois_don.collections ?? [];
  const collectionMois =
    collectionsMois.find((collection) => collection.annee === anneeChoisie) ?? collectionsMois[0];
  const cartesEvenement = cartes?.evenement.categories.flatMap((categorie) => categorie.cartes) ?? [];
  const cartesUniques = cartes
    ? [
        cartes.parrainage.carte_parrain,
        cartes.parrainage.carte_filleul,
        // ?. : un backend pas encore migré ne renvoie pas `fidelite`.
        cartes.fidelite?.carte ?? null,
      ].filter((carte) => carte !== null)
    : [];

  return (
    <View style={styles.screen}>
      <ScrollView key={cleOnglet} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTete
          variante="page"
          titre="Cartes"
          initiale={initialePseudo(profil?.pseudo)}
          avatarId={profil?.avatar_id}
          points={profil?.points_cumules ?? 0}
          profil={profil}
          notificationsNonLues={notificationsNonLues}
          onPressNotifications={() => router.push('/notifications')}
        />

        {!cartes && (
          <View style={styles.etat}>
            {loading && <Chargement message="On ouvre ton classeur…" />}
            {!loading && error && (
              <EtatErreur
                titre="Ton classeur est introuvable"
                message="Vérifie ton réseau puis réessaie."
                onReessayer={() => {
                  setError(false);
                  setLoading(true);
                  charger();
                }}
              />
            )}
          </View>
        )}

        {cartes && (
          <>
            {/* 📖 Pas de bandeau : ici, ce qui compte, ce sont les collections, affichées en
                entier. Le scan, qui les fait avancer, n'est qu'un raccourci d'une ligne. */}
            <Animated.View entering={entree(0)}>
              <RaccourciScan onPress={() => router.push('/tabs/don/scan')} />
            </Animated.View>

            {collectionMois && (
              <Animated.View entering={entree(1)}>
                <Collection
                  titre="Cartes du mois"
                  precision={`Collection ${collectionMois.annee}`}
                  icone="calendar"
                  cartes={collectionMois.cartes}
                >
                  {collectionsMois.length > 1 && (
                    <Filtres
                      marge={MARGE}
                      actif={String(collectionMois.annee)}
                      onChoisir={(cle) => setAnneeChoisie(Number(cle))}
                      filtres={collectionsMois.map((collection) => ({
                        cle: String(collection.annee),
                        libelle: String(collection.annee),
                        detail: `collection ${collection.annee}, ${compter(
                          collection.cartes.filter((carte) => carte.obtenue).length,
                          'carte'
                        )}`,
                      }))}
                    />
                  )}
                  <GrilleCartes
                    // key : changer d'année rejoue l'arrivée des cartes.
                    key={collectionMois.annee}
                    delaiDepart={100}
                    cartes={collectionMois.cartes.map((carte) => ({ ...carte, legende: getNomMois(carte.mois_numero) }))}
                    onOuvrir={ouvrirCarte}
                  />
                </Collection>
              </Animated.View>
            )}

            <Animated.View entering={entree(2)}>
              <Collection
                titre="Événements"
                precision="Collectes, forums, journées"
                icone="sparkles"
                cartes={cartesEvenement}
              >
                {cartesEvenement.length > 0 ? (
                  <GrilleCartes cartes={cartesEvenement} onOuvrir={ouvrirCarte} delaiDepart={200} />
                ) : (
                  <Text style={[Typo.legende, styles.vide]}>
                    Les cartes des prochains événements arriveront ici : collecte, forum, journée mondiale…
                  </Text>
                )}
              </Collection>
            </Animated.View>

            <Animated.View entering={entree(3)}>
              <Collection
                titre="Parrainage et fidélité"
                precision="Cartes uniques"
                icone="people"
                cartes={cartesUniques}
              >
                <GrilleCartes cartes={cartesUniques} onOuvrir={ouvrirCarte} delaiDepart={260} />
              </Collection>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// 📖 Raccourci vers le scan d'un don : la seule action de la page, en pétrole foncé
//    (texte crème ≈ 6:1) avec deux bulles décoratives, pour qu'il se remarque sans
//    redevenir un grand bandeau. Les cartes restent le sujet de la page.
//    Animé sans fin, en douceur : les bulles flottent et la flèche invite à toucher.
function RaccourciScan({ onPress }: { onPress: () => void }) {
  const corail = useFlottement(4200);
  const lime = useFlottement(3200);
  const fleche = useFlottement(900);
  const styleCorail = useAnimatedStyle(() => ({
    transform: [{ translateX: corail.value * -10 }, { translateY: corail.value * -8 }],
  }));
  const styleLime = useAnimatedStyle(() => ({
    transform: [{ translateX: lime.value * 14 }, { translateY: lime.value * 8 }],
  }));
  const styleFleche = useAnimatedStyle(() => ({ transform: [{ translateX: fleche.value * 3 }] }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Scanner un don, ta carte du mois arrive tout de suite"
      style={({ pressed }) => [styles.raccourci, pressed && styles.presse]}
    >
      <Animated.View style={[styles.bulle, styles.bulleCorail, styleCorail]} />
      <Animated.View style={[styles.bulle, styles.bulleLime, styleLime]} />

      <View style={styles.raccourciPastille}>
        <Ionicons name="qr-code" size={22} color={Theme.info.icone} />
      </View>
      <View style={styles.raccourciTextes}>
        <Text style={[Typo.corpsFort, styles.texteSurPetrole]}>Scanner un don</Text>
        <Text style={[Typo.legende, styles.texteSurPetrole]}>Ta carte du mois arrive tout de suite</Text>
      </View>
      <View style={styles.raccourciFleche}>
        <Animated.View style={styleFleche}>
          <Ionicons name="arrow-forward" size={18} color={Theme.texte.principal} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * Valeur qui va et vient sans fin entre 0 et 1 (une « respiration »), pour les décors.
 * 📖 Comme DecorBandeau : rien ne bouge si « Réduire les animations » est activé.
 */
function useFlottement(duree: number) {
  const avancement = useSharedValue(0);

  useEffect(() => {
    let actif = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduire) => {
        if (!actif || reduire) return;
        avancement.value = withRepeat(
          withTiming(1, { duration: duree, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        );
      })
      .catch(() => undefined);

    return () => {
      actif = false;
      cancelAnimation(avancement);
    };
  }, [avancement, duree]);

  return avancement;
}

/**
 * Section d'une collection : petite icône et titre, compteur « 5/12 » bien lisible,
 * puis toutes ses cartes.
 * 📖 L'icône, sans pastille et de la couleur du texte, est un simple repère : le titre
 *    porte l'information.
 */
function Collection({
  titre,
  precision,
  icone,
  cartes,
  children,
}: {
  titre: string;
  /** Petite ligne sous le titre (ex. l'année). */
  precision?: string;
  icone: keyof typeof Ionicons.glyphMap;
  cartes: { obtenue: boolean }[];
  children: ReactNode;
}) {
  const obtenues = cartes.filter((carte) => carte.obtenue).length;
  const total = cartes.length;
  const complete = total > 0 && obtenues === total;

  return (
    <View style={styles.section}>
      <View style={styles.enTete}>
        <View style={styles.enTeteLigne}>
          <View style={styles.enTeteTextes}>
            <View style={styles.titreLigne}>
              <Ionicons name={icone} size={18} color={Theme.texte.principal} />
              <Text style={[Typo.titre3, styles.titre]} accessibilityRole="header">
                {titre}
              </Text>
            </View>
            {!!precision && <Text style={[Typo.legende, styles.sousTitre]}>{precision}</Text>}
          </View>

          {/* 📖 Collection complète : coche + texte, pas la couleur seule. */}
          {total > 0 &&
            (complete ? (
              <View style={styles.complete}>
                <Ionicons name="checkmark-circle" size={18} color={Theme.feedback.succesTexte} />
                <Text style={[Typo.legendeForte, styles.completeTexte]}>Complète</Text>
              </View>
            ) : (
              <Text
                style={styles.compteur}
                accessibilityLabel={`${compter(obtenues, 'carte')} sur ${total}`}
              >
                {obtenues}
                <Text style={[Typo.legendeForte, styles.sousTitre]}>/{total}</Text>
              </Text>
            ))}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    // flexGrow : le contenu occupe au moins tout l'écran, pour pouvoir centrer un état.
    flexGrow: 1,
    padding: MARGE,
    paddingTop: 54,
    paddingBottom: 126,
    gap: Espace[8],
  },
  etat: {
    flex: 1,
    justifyContent: 'center',
  },
  presse: { opacity: 0.7 },
  raccourci: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[4],
    borderRadius: Rayon.lg,
    overflow: 'hidden',
    backgroundColor: Theme.info.icone,
    ...Ombre.flottante,
  },
  bulle: {
    position: 'absolute',
    borderRadius: Rayon.plein,
  },
  bulleCorail: {
    width: 96,
    height: 96,
    right: -24,
    bottom: -48,
    backgroundColor: Palette.corail[500],
    opacity: 0.85,
  },
  bulleLime: {
    width: 36,
    height: 36,
    right: 64,
    top: -14,
    backgroundColor: Palette.lime[500],
    opacity: 0.6,
  },
  raccourciPastille: {
    width: 44,
    height: 44,
    borderRadius: Rayon.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
  },
  raccourciTextes: {
    flex: 1,
  },
  texteSurPetrole: {
    color: Theme.texte.surAccent,
  },
  raccourciFleche: {
    width: 36,
    height: 36,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
  },
  section: {
    gap: Espace[4],
  },
  enTete: {
    gap: Espace[3],
  },
  enTeteLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
  },
  enTeteTextes: {
    flex: 1,
    // Un peu d’air entre le titre et sa petite ligne.
    gap: Espace[1],
  },
  titreLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
  },
  titre: {
    color: Theme.texte.principal,
  },
  sousTitre: {
    color: Theme.texte.secondaire,
  },
  compteur: {
    ...Typo.titre2,
    color: Theme.texte.principal,
  },
  complete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[1],
  },
  completeTexte: {
    color: Theme.feedback.succesTexte,
  },
  vide: {
    color: Theme.texte.secondaire,
  },
});
