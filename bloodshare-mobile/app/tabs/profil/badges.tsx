import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { VisuelBadge } from '../../../components/badges/VisuelBadge';
import { BarreProgression } from '../../../components/ui/BarreProgression';
import { Chargement } from '../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { FeuilleBas } from '../../../components/ui/FeuilleBas';
import { Filtres } from '../../../components/ui/Filtres';
import { entreeSousPage } from '../../../constants/animations';
import {
  infoBadge,
  CATEGORIE_COLOR,
  CATEGORIE_LABEL,
  CATEGORIES_FILTRE,
  CategorieBadge,
} from '../../../constants/badges';
import { Theme } from '../../../constants/colors';
import { Espace, Ombre, Rayon } from '../../../constants/spacing';
import { Typo } from '../../../constants/typography';
import { Badge, getBadges } from '../../../services/badges.service';
import { formaterDateHeureCourte, formaterDateHeureLongue } from '../../../utils/dates';
import { compter } from '../../../utils/pluriel';
import { CONTENU_MARGE_BASSE } from '../_layout';

// 📖 « Révélation » du badge : le médaillon grandit avec un léger rebond, juste après
//    l'arrivée de la feuille (qui dure 320 ms). Rien ne bouge si « Réduire les animations ».
const REVELATION = ZoomIn.delay(180).springify().damping(12).stiffness(220).reduceMotion(ReduceMotion.System);

// 📖 Fond pâle de la catégorie : sa couleur à 15 % d'opacité (suffixe hexa « 26 »).
const fondCategorie = (categorie: CategorieBadge) => `${CATEGORIE_COLOR[categorie]}26`;

const TOUS = 'tous';
const COLONNES = 3;
const MARGE = 18;

// 📖 Les badges obtenus sont des stickers « collés » : chacun penche un peu, pas tous du
//    même côté. Faible (≤ 3°), comme les cartes chiffres : décoratif, jamais gênant.
const INCLINAISONS = ['-3deg', '2deg', '-1deg', '3deg', '-2deg', '1deg'] as const;

/** Découpe la liste en lignes de 3 : la dernière ligne garde des tuiles de même largeur. */
const enLignes = <T,>(elements: T[]): T[][] =>
  Array.from({ length: Math.ceil(elements.length / COLONNES) }, (_, i) =>
    elements.slice(i * COLONNES, i * COLONNES + COLONNES),
  );

/** Badges obtenus, le plus récent d'abord. */
const parDateObtention = (badges: Badge[]) =>
  badges
    .filter((b) => b.obtenu)
    .sort((a, b) => (b.obtenu_at ?? '').localeCompare(a.obtenu_at ?? ''));

export default function BadgesScreen() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtreActif, setFiltreActif] = useState<string>(TOUS);
  const [badgeSelectionne, setBadgeSelectionne] = useState<Badge | null>(null);

  const charger = useCallback(() => {
    let cancelled = false;

    getBadges()
      .then((data) => {
        if (!cancelled) setBadges(data);
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
    filtreActif === TOUS ? badges : badges.filter((b) => infoBadge(b.nom).categorie === filtreActif);
  const obtenus = parDateObtention(badgesFiltres);
  const aDebloquer = badgesFiltres.filter((b) => !b.obtenu);
  const nbObtenus = badges.filter((b) => b.obtenu).length;
  // Toutes catégories confondues : la carte vedette ne dépend pas du filtre.
  const dernier = parDateObtention(badges)[0] ?? null;
  const pret = !loading && !error;

  const filtres = [
    { cle: TOUS, libelle: 'Tous', detail: compter(badges.length, 'badge') },
    ...CATEGORIES_FILTRE.map((categorie) => ({
      cle: categorie,
      libelle: CATEGORIE_LABEL[categorie],
      detail: compter(badges.filter((b) => infoBadge(b.nom).categorie === categorie).length, 'badge'),
    })),
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 📖 Pas de sous-titre : la barre « Ma collection » donne déjà le décompte.
            Pas de bandeau non plus : il est réservé aux pages principales (Quiz, Don). */}
        <EnTeteSousPage titre="Mes badges" />

        {loading && <Chargement message="On récupère tes badges…" />}
        {!loading && error && <EtatErreur onReessayer={reessayer} />}

        {pret && (
          <Animated.View entering={entreeSousPage} style={styles.sections}>
            <BarreProgression
              titre="Ma collection"
              valeur={nbObtenus}
              max={badges.length}
              detail={`${nbObtenus} sur ${badges.length}`}
            />

            {dernier && <CarteDernierBadge badge={dernier} onPress={() => setBadgeSelectionne(dernier)} />}

            <Filtres filtres={filtres} actif={filtreActif} onChoisir={setFiltreActif} marge={MARGE} />

            {/* 📖 La clé change avec le filtre : les sections réapparaissent en fondu,
                ce qui signale que la liste a changé. */}
            <Animated.View key={filtreActif} entering={FadeIn.duration(220)} style={styles.sections}>
              {badgesFiltres.length === 0 && (
                <Text style={[Typo.corps, styles.aucun]}>{"Aucun badge dans cette catégorie pour l'instant."}</Text>
              )}

              {obtenus.length > 0 && (
                <SectionBadges titre="Obtenus" badges={obtenus} onChoisir={setBadgeSelectionne} />
              )}
              {aDebloquer.length > 0 && (
                <SectionBadges titre="À débloquer" badges={aDebloquer} onChoisir={setBadgeSelectionne} />
              )}
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>

      <FeuilleBas visible={badgeSelectionne !== null} onFermer={() => setBadgeSelectionne(null)}>
        {badgeSelectionne && <DetailBadge badge={badgeSelectionne} />}
      </FeuilleBas>
    </View>
  );
}

function SectionBadges({
  titre,
  badges,
  onChoisir,
}: {
  titre: string;
  badges: Badge[];
  onChoisir: (badge: Badge) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionEnTete}>
        <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
          {titre}
        </Text>
        <View style={styles.compteur}>
          <Text style={[Typo.legendeForte, styles.compteurTexte]}>{badges.length}</Text>
        </View>
      </View>

      <View style={styles.grille}>
        {enLignes(badges).map((ligne, i) => (
          <View key={i} style={styles.ligne}>
            {ligne.map((badge, j) => (
              <TuileBadge
                key={badge.id}
                badge={badge}
                inclinaison={INCLINAISONS[(i * COLONNES + j) % INCLINAISONS.length]}
                onPress={() => onChoisir(badge)}
              />
            ))}
            {/* Cases vides : la dernière ligne garde des tuiles de même largeur. */}
            {Array.from({ length: COLONNES - ligne.length }, (_, k) => (
              <View key={`vide-${k}`} style={styles.tuileVide} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const HALO = 76;
const STICKER = 80;

// 📖 Vitrine : chaque badge obtenu est exposé sur une carte blanche surélevée (elle se
//    touche), l'illustration posée sur un halo pâle de la couleur de sa catégorie et
//    légèrement penchée. Un badge à débloquer est une carte vide en pointillé, à plat :
//    visuel grisé, cadenas, et ce qu'il reste à faire écrit dessous.
function TuileBadge({ badge, inclinaison, onPress }: { badge: Badge; inclinaison: string; onPress: () => void }) {
  const info = infoBadge(badge.nom);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${badge.nom}, ${badge.obtenu ? 'badge obtenu' : `à débloquer : ${info.condition}`}`}
      accessibilityHint="Affiche le détail du badge"
      style={({ pressed }) => [
        styles.tuile,
        badge.obtenu ? styles.tuileObtenue : styles.tuileVerrouillee,
        pressed && styles.tuilePresse,
      ]}
    >
      <View style={[styles.halo, { backgroundColor: badge.obtenu ? fondCategorie(info.categorie) : 'transparent' }]}>
        <View style={badge.obtenu && { transform: [{ rotate: inclinaison }] }}>
          <VisuelBadge
            imageUrl={badge.image_url}
            emoji={info.emoji}
            taille={badge.obtenu ? STICKER : HALO - Espace[2]}
            verrouille={!badge.obtenu}
          />
        </View>
        {/* 📖 Verrouillé = cadenas + pointillés + visuel grisé : pas la couleur seule. */}
        {!badge.obtenu && (
          <View style={styles.cadenas}>
            <Ionicons name="lock-closed" size={12} color={Theme.texte.secondaire} />
          </View>
        )}
      </View>

      <Text
        style={[Typo.legendeForte, badge.obtenu ? styles.nom : styles.nomVerrouille]}
        numberOfLines={2}
      >
        {badge.nom}
      </Text>
      {badge.obtenu && badge.obtenu_at && (
        <Text style={[Typo.legende, styles.condition]}>{formaterDateHeureCourte(badge.obtenu_at)}</Text>
      )}
      {/* Ce qu'il reste à faire, directement dans la grille : plus besoin d'ouvrir le badge. */}
      {!badge.obtenu && (
        <Text style={[Typo.legende, styles.condition]} numberOfLines={2}>
          {info.condition}
        </Text>
      )}
    </Pressable>
  );
}

const VEDETTE = 104;

// 📖 Le dernier badge obtenu, mis en avant en tête de la vitrine : grande illustration
//    penchée qui déborde de son halo, et sa date. Toucher la carte ouvre son détail.
function CarteDernierBadge({ badge, onPress }: { badge: Badge; onPress: () => void }) {
  const info = infoBadge(badge.nom);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Dernier badge obtenu : ${badge.nom}`}
      accessibilityHint="Affiche le détail du badge"
      style={({ pressed }) => [styles.vedette, pressed && styles.tuilePresse]}
    >
      <View style={[styles.vedetteHalo, { backgroundColor: fondCategorie(info.categorie) }]}>
        <View style={styles.vedetteIncline}>
          <VisuelBadge imageUrl={badge.image_url} emoji={info.emoji} taille={VEDETTE} />
        </View>
      </View>
      <View style={styles.vedetteTextes}>
        <Text style={[Typo.legendeForte, styles.vedetteSurtitre]}>Dernier badge</Text>
        <Text style={[Typo.titre3, styles.nom]} numberOfLines={2}>
          {badge.nom}
        </Text>
        {badge.obtenu_at && (
          <Text style={[Typo.legende, styles.condition]}>Débloqué le {formaterDateHeureLongue(badge.obtenu_at)}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Theme.texte.secondaire} />
    </Pressable>
  );
}

const DETAIL_STICKER = 136;
// Retrait de l'illustration dans l'emplacement pointillé d'un badge à débloquer.
const DETAIL_BORD = 8;

function DetailBadge({ badge }: { badge: Badge }) {
  const info = infoBadge(badge.nom);

  return (
    <>
      {/* Même langage que la grille, en grand : illustration penchée ou emplacement vide. */}
      <Animated.View
        entering={REVELATION}
        style={[
          badge.obtenu ? [styles.sticker, styles.detailSticker] : [styles.emplacement, styles.detailEmplacement],
          badge.obtenu && !badge.image_url && { backgroundColor: fondCategorie(info.categorie) },
        ]}
      >
        <VisuelBadge
          imageUrl={badge.image_url}
          emoji={info.emoji}
          taille={badge.obtenu ? DETAIL_STICKER : DETAIL_STICKER - 2 * DETAIL_BORD}
          verrouille={!badge.obtenu}
        />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: MARGE,
    paddingTop: 54,
    paddingBottom: CONTENU_MARGE_BASSE,
  },
  sections: {
    gap: Espace[6],
  },
  aucun: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
    marginTop: Espace[4],
  },

  section: {
    gap: Espace[3],
  },
  sectionEnTete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
  },
  sectionTitre: {
    color: Theme.texte.principal,
  },
  compteur: {
    minWidth: 28,
    paddingHorizontal: Espace[2],
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surfaceEnfoncee,
    alignItems: 'center',
  },
  compteurTexte: { color: Theme.texte.principal },
  grille: {
    gap: Espace[3],
  },
  ligne: {
    flexDirection: 'row',
    gap: Espace[3],
  },
  tuile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingTop: Espace[3],
    paddingBottom: Espace[3],
    paddingHorizontal: Espace[2],
    borderRadius: Rayon.lg,
  },
  // Surélevée : un badge obtenu se touche (« surélevé = interactif »).
  tuileObtenue: {
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  // À plat et en pointillé : une place encore vide dans la vitrine.
  tuileVerrouillee: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Theme.formulaire.bordure,
  },
  tuilePresse: {
    opacity: 0.85,
  },
  tuileVide: { flex: 1 },
  // 📖 L'illustration (80 px) déborde un peu de son halo (76 px) : elle a l'air posée
  //    dessus plutôt qu'enfermée dedans.
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espace[2],
  },

  vedette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[4],
    padding: Espace[4],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  vedetteHalo: {
    width: VEDETTE - Espace[4],
    height: VEDETTE - Espace[4],
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vedetteIncline: {
    transform: [{ rotate: '-6deg' }],
  },
  vedetteTextes: {
    flex: 1,
    gap: 2,
  },
  vedetteSurtitre: {
    color: Theme.texte.secondaire,
  },

  sticker: {
    width: STICKER,
    height: STICKER,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nom: {
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  // Emplacement en pointillé du détail d'un badge à débloquer (taille dans detailEmplacement).
  emplacement: {
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surfaceEnfoncee,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Theme.formulaire.bordure,
  },
  nomVerrouille: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
  },
  condition: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
  },
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

  detailSticker: {
    width: DETAIL_STICKER,
    height: DETAIL_STICKER,
    transform: [{ rotate: '-4deg' }],
  },
  detailEmplacement: {
    width: DETAIL_STICKER,
    height: DETAIL_STICKER,
  },
  detailCadenas: {
    position: 'absolute',
    right: Espace[1],
    bottom: Espace[1],
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
