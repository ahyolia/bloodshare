import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { BarreProgression } from '../../../components/ui/BarreProgression';
import { Chargement } from '../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { FeuilleBas } from '../../../components/ui/FeuilleBas';
import { entreeSousPage } from '../../../constants/animations';
import {
  BADGES_INFO,
  BadgeInfo,
  CATEGORIE_COLOR,
  CATEGORIE_LABEL,
  CATEGORIES_FILTRE,
  CategorieBadge,
} from '../../../constants/badges';
import { Theme } from '../../../constants/colors';
import { Espace, Rayon } from '../../../constants/spacing';
import { Typo } from '../../../constants/typography';
import { Badge, getBadges } from '../../../services/badges.service';
import { formaterDateHeureLongue } from '../../../utils/dates';
import { CONTENU_MARGE_BASSE } from '../_layout';

// 📖 Repli si un badge existe en base (BO) mais pas encore dans BADGES_INFO : l'écran
//    affiche quand même quelque chose de cohérent plutôt qu'un `undefined` qui plante
//    l'accès à `info.categorie` un peu partout ci-dessous.
const INFO_PAR_DEFAUT: BadgeInfo = {
  emoji: '🏅',
  categorie: 'dons',
  description: 'Un nouveau badge à découvrir.',
  condition: 'Continue à utiliser Aïma pour le débloquer.',
};

const infoDe = (nom: string): BadgeInfo => BADGES_INFO[nom] ?? INFO_PAR_DEFAUT;

// 📖 « Révélation » du badge : le médaillon grandit avec un léger rebond, juste après
//    l'arrivée de la feuille (qui dure 320 ms). Rien ne bouge si « Réduire les animations ».
const REVELATION = ZoomIn.delay(180).springify().damping(12).stiffness(220).reduceMotion(ReduceMotion.System);

// 📖 Fond pâle de la catégorie : sa couleur à 15 % d'opacité (suffixe hexa « 26 »).
const fondCategorie = (categorie: CategorieBadge) => `${CATEGORIE_COLOR[categorie]}26`;

const COLONNES = 3;

/** Découpe la liste en lignes de 3 : la dernière ligne garde des tuiles de même largeur. */
const enLignes = <T,>(elements: T[]): T[][] =>
  Array.from({ length: Math.ceil(elements.length / COLONNES) }, (_, i) =>
    elements.slice(i * COLONNES, i * COLONNES + COLONNES),
  );

export default function BadgesScreen() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtreActif, setFiltreActif] = useState<'tous' | CategorieBadge>('tous');
  const [badgeSelectionne, setBadgeSelectionne] = useState<Badge | null>(null);

  const charger = useCallback(() => {
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

  useEffect(() => charger(), [charger]);

  // 📖 Remise à zéro ici et pas dans `charger` : appelée depuis l'effet, elle
  //    déclencherait un rendu en cascade (règle react-hooks du lint).
  const reessayer = () => {
    setLoading(true);
    setError(false);
    charger();
  };

  const badgesFiltres =
    filtreActif === 'tous' ? badges : badges.filter((b) => infoDe(b.nom).categorie === filtreActif);

  const nbObtenus = badges.filter((b) => b.obtenu).length;
  const pret = !loading && !error;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 📖 Pas de sous-titre : la barre « Ma collection » donne déjà le décompte. */}
        <EnTeteSousPage titre="Mes badges" />

        {loading && <Chargement message="On récupère tes badges…" />}
        {!loading && error && <EtatErreur onReessayer={reessayer} />}

        {pret && (
          <>
            <Animated.View entering={entreeSousPage}>
              <BarreProgression
                titre="Ma collection"
                valeur={nbObtenus}
                max={badges.length}
                detail={`${nbObtenus} sur ${badges.length}`}
              />
            </Animated.View>

            {/* FILTRES — débordent volontairement jusqu'aux bords de l'écran */}
            <Animated.View entering={entreeSousPage}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtresDefilement}
                contentContainerStyle={styles.filtres}
              >
                <Puce libelle="Tous" active={filtreActif === 'tous'} onPress={() => setFiltreActif('tous')} />
                {CATEGORIES_FILTRE.map((categorie) => (
                  <Puce
                    key={categorie}
                    libelle={CATEGORIE_LABEL[categorie]}
                    active={filtreActif === categorie}
                    onPress={() => setFiltreActif(categorie)}
                  />
                ))}
              </ScrollView>
            </Animated.View>

            {badgesFiltres.length === 0 ? (
              <Text style={[Typo.corps, styles.aucun]}>{"Aucun badge dans cette catégorie pour l'instant."}</Text>
            ) : (
              // 📖 La clé change avec le filtre : la grille est recréée et rejoue son
              //    animation d'entrée, ce qui signale que la liste a changé.
              <View key={filtreActif} style={styles.grille}>
                {enLignes(badgesFiltres).map((ligne, i) => (
                  <Animated.View key={i} entering={entreeSousPage} style={styles.ligne}>
                    {ligne.map((badge) => (
                      <TuileBadge key={badge.id} badge={badge} onPress={() => setBadgeSelectionne(badge)} />
                    ))}
                    {/* Cases vides : la dernière ligne garde des tuiles de même largeur. */}
                    {Array.from({ length: COLONNES - ligne.length }, (_, j) => (
                      <View key={`vide-${j}`} style={styles.tuileVide} />
                    ))}
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <FeuilleBas visible={badgeSelectionne !== null} onFermer={() => setBadgeSelectionne(null)}>
        {badgeSelectionne && <DetailBadge badge={badgeSelectionne} />}
      </FeuilleBas>
    </View>
  );
}

function Puce({ libelle, active, onPress }: { libelle: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.puce, active ? styles.puceActive : styles.puceInactive, pressed && styles.presse]}
    >
      <Text style={[Typo.legendeForte, { color: active ? Theme.texte.surAccent : Theme.texte.secondaire }]}>
        {libelle}
      </Text>
    </Pressable>
  );
}

function TuileBadge({ badge, onPress }: { badge: Badge; onPress: () => void }) {
  const info = infoDe(badge.nom);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${badge.nom}, ${badge.obtenu ? 'badge obtenu' : 'badge à débloquer'}`}
      accessibilityHint="Affiche comment l'obtenir"
      style={({ pressed }) => [styles.tuile, pressed && styles.tuilePresse]}
    >
      <View
        style={[
          styles.medaille,
          badge.obtenu
            ? { backgroundColor: fondCategorie(info.categorie) }
            : styles.medailleVerrouillee,
        ]}
      >
        <Text style={[styles.emoji, !badge.obtenu && styles.emojiVerrouille]}>{info.emoji}</Text>
        {/* 📖 Verrouillé = cadenas + médaillon pointillé + emoji estompé : pas la couleur seule. */}
        {!badge.obtenu && (
          <View style={styles.cadenas}>
            <Ionicons name="lock-closed" size={12} color={Theme.texte.secondaire} />
          </View>
        )}
      </View>

      <Text
        style={[Typo.legendeForte, styles.nom, { color: badge.obtenu ? Theme.texte.principal : Theme.texte.secondaire }]}
        numberOfLines={2}
      >
        {badge.nom}
      </Text>
    </Pressable>
  );
}

function DetailBadge({ badge }: { badge: Badge }) {
  const info = infoDe(badge.nom);

  return (
    <>
      <Animated.View
        entering={REVELATION}
        style={[
          styles.detailMedaille,
          { backgroundColor: badge.obtenu ? fondCategorie(info.categorie) : Theme.fond.surfaceEnfoncee },
        ]}
      >
        <Text style={[styles.detailEmoji, !badge.obtenu && styles.emojiVerrouille]}>{info.emoji}</Text>
        {!badge.obtenu && (
          <View style={styles.detailCadenas}>
            <Ionicons name="lock-closed" size={16} color={Theme.texte.principal} />
          </View>
        )}
      </Animated.View>

      <Text style={[Typo.titre2, styles.detailTitre]} accessibilityRole="header">
        {badge.nom}
      </Text>
      <View style={[styles.categorie, { backgroundColor: fondCategorie(info.categorie) }]}>
        <Text style={[Typo.legendeForte, { color: Theme.texte.principal }]}>{CATEGORIE_LABEL[info.categorie]}</Text>
      </View>

      <View style={styles.detailBloc}>
        <Text style={[Typo.legendeForte, { color: Theme.texte.secondaire }]}>{"Comment l'obtenir ?"}</Text>
        <Text style={[Typo.corps, { color: Theme.texte.principal }]}>{info.condition}</Text>
        <Text style={[Typo.legende, styles.description]}>{info.description}</Text>
      </View>

      {badge.obtenu && badge.obtenu_at ? (
        <View style={[styles.statut, { backgroundColor: Theme.feedback.succesSurface }]}>
          <Ionicons name="checkmark-circle" size={20} color={Theme.feedback.succesTexte} />
          <Text style={[Typo.legendeForte, { color: Theme.texte.principal }]}>
            Débloqué le {formaterDateHeureLongue(badge.obtenu_at)}
          </Text>
        </View>
      ) : (
        <View style={[styles.statut, { backgroundColor: Theme.fond.surfaceEnfoncee }]}>
          <Ionicons name="sparkles-outline" size={20} color={Theme.texte.secondaire} />
          <Text style={[Typo.legende, styles.encouragement]}>
            Continue à participer pour débloquer ce badge !
          </Text>
        </View>
      )}
    </>
  );
}

const MEDAILLE = 64;
const DETAIL_MEDAILLE = 96;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: CONTENU_MARGE_BASSE,
  },
  filtresDefilement: {
    marginHorizontal: -18,
    marginTop: Espace[6],
  },
  filtres: {
    paddingHorizontal: 18,
    gap: Espace[2],
  },
  puce: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Espace[4],
    borderRadius: Rayon.plein,
  },
  puceActive: {
    backgroundColor: Theme.action.primaire,
  },
  puceInactive: {
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  presse: { opacity: 0.85 },
  aucun: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
    marginTop: Espace[8],
  },
  grille: {
    gap: Espace[3],
    marginTop: Espace[4],
  },
  ligne: {
    flexDirection: 'row',
    gap: Espace[3],
  },
  // 📖 Exception assumée à « surélevé = interactif » : 15 cartes ombrées alourdissaient
  //    la grille. Un badge reste un médaillon et son nom (comme le Badge du design
  //    system) ; la grille se lit comme une collection, et l'appui assombrit le badge.
  tuile: {
    flex: 1,
    alignItems: 'center',
    gap: Espace[2],
    paddingVertical: Espace[2],
    paddingHorizontal: Espace[1],
    borderRadius: Rayon.lg,
  },
  tuilePresse: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  tuileVide: { flex: 1 },
  medaille: {
    width: MEDAILLE,
    height: MEDAILLE,
    borderRadius: MEDAILLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medailleVerrouillee: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Theme.formulaire.bordure,
  },
  emoji: { fontSize: 32 },
  emojiVerrouille: { opacity: 0.35 },
  nom: { textAlign: 'center' },
  cadenas: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },

  detailMedaille: {
    width: DETAIL_MEDAILLE,
    height: DETAIL_MEDAILLE,
    borderRadius: DETAIL_MEDAILLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmoji: { fontSize: 48 },
  detailCadenas: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  detailTitre: {
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  categorie: {
    paddingHorizontal: Espace[3],
    paddingVertical: Espace[1],
    borderRadius: Rayon.plein,
  },
  detailBloc: {
    alignSelf: 'stretch',
    gap: Espace[1],
    marginTop: Espace[2],
  },
  description: {
    color: Theme.texte.secondaire,
    marginTop: Espace[2],
  },
  statut: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
    padding: Espace[3],
    borderRadius: Rayon.md,
  },
  encouragement: {
    flex: 1,
    color: Theme.texte.secondaire,
  },
});
