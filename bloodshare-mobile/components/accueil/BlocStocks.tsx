import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { useReduireAnimations } from '../../hooks/useReduireAnimations';
import { GROUPES_SANGUINS, type NiveauStock, type StockGroupe } from '../../services/stockSang.service';
import { groupeAffiche, groupeLu, pageCarrousel, resumeStocks } from '../../utils/accueil';
import { NIVEAUX } from '../ui/PastilleStock';

type Props = {
  /** `null` : les niveaux n'ont pas pu être chargés. */
  stocks: StockGroupe[] | null;
  onPrendreRendezVous: () => void;
};

// 📖 Les groupes qui manquent le plus passent devant : dans le carrousel, ils sont
//    visibles sans faire défiler. À niveau égal, l'ordre habituel des groupes.
const PRIORITE: Record<NiveauStock, number> = { critique: 0, bas: 1, correct: 2, bon: 3 };
const ordonner = (stocks: StockGroupe[]) =>
  GROUPES_SANGUINS.map((groupe) => ({
    groupe,
    niveau: stocks.find((s) => s.groupe === groupe)?.niveau ?? null,
  })).sort((a, b) => (a.niveau ? PRIORITE[a.niveau] : 4) - (b.niveau ? PRIORITE[b.niveau] : 4));

const CASE = 64;
const ECART = Espace[2];
const PAS = CASE + ECART;

// 📖 Réserves du Centre de don, en tête de l'accueil. Une information : bloc à plat (fond
//    surface et contour fin, comme le Bloc du design system), pour laisser le lime du défi
//    seul bloc vedette. Les gouttes défilent en carrousel ; le lien de prise de
//    rendez-vous reste dans l'en-tête du bloc.
export function BlocStocks({ stocks, onPrendreRendezVous }: Props) {
  const [largeur, setLargeur] = useState(0);
  const [page, setPage] = useState(0);
  const groupes = stocks ? ordonner(stocks) : [];
  // Nombre de « pages » du carrousel, une fois sa largeur connue.
  const parPage = largeur > 0 ? Math.max(1, Math.floor((largeur + ECART) / PAS)) : groupes.length;
  const pages = Math.ceil(groupes.length / parPage);

  return (
    <View style={styles.bloc}>
      <View style={styles.enTete}>
        <Text style={[Typo.titre3, styles.texte]} accessibilityRole="header">
          Réserves de sang
        </Text>
        <Text style={[Typo.legende, styles.secondaire]}>
          {stocks ? resumeStocks(stocks) : 'Les niveaux font une pause. Tire vers le bas pour réessayer.'}
        </Text>
      </View>

      {stocks && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onLayout={(e) => setLargeur(e.nativeEvent.layout.width - 2 * Espace[4])}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              setPage(
                pageCarrousel(
                  { decalage: contentOffset.x, largeurContenu: contentSize.width, largeurVisible: layoutMeasurement.width },
                  PAS * parPage,
                  pages
                )
              );
            }}
            scrollEventThrottle={16}
            snapToInterval={PAS}
            decelerationRate="fast"
            // Le carrousel va jusqu'aux bords du bloc : on voit qu'il défile.
            style={styles.rangee}
            contentContainerStyle={styles.rangeeContenu}
          >
            {groupes.map(({ groupe, niveau }, rang) => (
              <GoutteStock key={groupe} groupe={groupe} niveau={niveau} rang={rang} />
            ))}
          </ScrollView>
      )}

      {/* Pied du bloc : la pagination du carrousel à gauche, l'action à droite. */}
      <View style={styles.pied}>
        <View style={styles.points} accessible={false}>
          {stocks &&
            pages > 1 &&
            Array.from({ length: pages }).map((_, i) => (
              <View key={i} style={[styles.point, i === page && styles.pointActif]} />
            ))}
        </View>
        <Pressable
          onPress={onPrendreRendezVous}
          accessibilityRole="link"
          accessibilityLabel="Prendre rendez-vous"
          accessibilityHint="Ouvre le site du Centre de don du sang"
          hitSlop={6}
          style={({ pressed }) => [styles.lien, pressed && styles.presse]}
        >
          <Ionicons name="calendar-outline" size={16} color={Theme.action.primaireTexte} />
          <Text style={[Typo.legendeForte, styles.lienTexte]}>Prendre rendez-vous</Text>
        </Pressable>
      </View>
    </View>
  );
}

// 📖 Hauteur de remplissage de la goutte selon le niveau : une goutte presque vide se
//    comprend d'un coup d'œil. Le libellé et l'icône disent la même chose (pas la couleur seule).
const REMPLISSAGE: Record<NiveauStock, number> = {
  critique: 0.2,
  bas: 0.45,
  correct: 0.7,
  bon: 0.95,
};

/** Côté du carré arrondi qui, tourné de 45°, dessine la goutte. */
const GOUTTE = 30;
// 📖 La goutte tournée va de sa pointe (0,71 × GOUTTE au-dessus du centre) au bas de son
//    arrondi (0,5 × GOUTTE en dessous). Le remplissage se mesure sur cette hauteur visible.
const HAUTEUR_VISIBLE = GOUTTE * 1.21;
const BOITE = GOUTTE * 1.5;
const BAS_INVISIBLE = (BOITE - HAUTEUR_VISIBLE) / 2 + GOUTTE * 0.1;

function GoutteStock({ groupe, niveau, rang }: { groupe: string; niveau: NiveauStock | null; rang: number }) {
  const infos = niveau ? NIVEAUX[niveau] : null;
  const reduire = useReduireAnimations();

  // 📖 Les gouttes se remplissent l'une après l'autre à l'arrivée sur la page.
  //    Reanimated saute l'animation si « Réduire les animations » est activé.
  const remplissage = useSharedValue(0);
  useEffect(() => {
    remplissage.value = withDelay(
      200 + rang * 60,
      withTiming(niveau ? REMPLISSAGE[niveau] : 0, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [niveau, rang, remplissage]);
  const styleRemplissage = useAnimatedStyle(() => ({
    height: BAS_INVISIBLE + remplissage.value * HAUTEUR_VISIBLE,
  }));

  // 📖 Un stock critique « bat » doucement, pour attirer l'œil sans affoler.
  //    cancelAnimation fige la valeur là où elle en est : on la remet à 0, sinon la goutte
  //    resterait à moitié agrandie (stock qui n'est plus critique après un rafraîchissement,
  //    « Réduire les animations » activé pendant que l'écran est ouvert).
  const battement = useSharedValue(0);
  useEffect(() => {
    const arreter = () => {
      cancelAnimation(battement);
      battement.value = 0;
    };
    arreter();
    if (niveau !== 'critique' || reduire !== false) return;
    battement.value = withDelay(
      1200,
      withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    return arreter;
  }, [battement, niveau, reduire]);
  const styleBattement = useAnimatedStyle(() => ({ transform: [{ scale: 1 + battement.value * 0.1 }] }));

  return (
    <View
      style={[styles.case, { backgroundColor: infos?.fond ?? Theme.fond.surfaceEnfoncee }]}
      accessible
      accessibilityLabel={`${groupeLu(groupe)}, stock ${infos ? infos.libelle.toLowerCase() : 'non communiqué'}`}
    >
      <Animated.View style={[styles.cadreGoutte, styleBattement]}>
        <View style={styles.goutte}>
          {/* Vue remise droite (−45°) : le niveau monte à l'horizontale dans la goutte. */}
          <View style={styles.redresse}>
            <Animated.View
              style={[styles.remplissage, { backgroundColor: infos?.puce ?? 'transparent' }, styleRemplissage]}
            />
          </View>
        </View>
        {/* Icône du niveau posée sur la goutte, comme un badge. */}
        {infos && (
          <View style={[styles.puce, { backgroundColor: infos.puce }]}>
            <Ionicons name={infos.icone} size={10} color={infos.iconePuce} />
          </View>
        )}
      </Animated.View>

      <Text style={[Typo.corpsFort, styles.texte]}>{groupeAffiche(groupe)}</Text>
      <Text style={[Typo.legende, styles.niveau]} numberOfLines={1} adjustsFontSizeToFit>
        {infos ? infos.libelle : 'Inconnu'}
      </Text>
    </View>
  );
}

const PUCE = 18;

const styles = StyleSheet.create({
  bloc: {
    paddingVertical: Espace[4],
    gap: Espace[3],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  enTete: {
    gap: 2,
    paddingHorizontal: Espace[4],
  },
  pied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Espace[3],
    paddingHorizontal: Espace[4],
  },
  texte: { color: Theme.texte.principal },
  secondaire: { color: Theme.texte.secondaire },
  // 📖 Petite pilule aubergine : la seule action du bloc, qui se voit sans l'alourdir.
  //    Texte blanc sur aubergine : 13:1.
  lien: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Espace[3],
    paddingVertical: 6,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.action.primaire,
  },
  lienTexte: { color: Theme.action.primaireTexte },
  presse: { opacity: 0.8 },
  rangee: { flexGrow: 0 },
  rangeeContenu: {
    gap: ECART,
    paddingHorizontal: Espace[4],
  },
  // Pastel du niveau en fond de case : on repère les groupes en tension d'un coup d'œil.
  case: {
    width: CASE,
    alignItems: 'center',
    paddingTop: Espace[1],
    paddingBottom: Espace[2],
    borderRadius: Rayon.md,
  },
  cadreGoutte: {
    width: BOITE,
    height: BOITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 📖 Même dessin que les gouttes du bandeau Don : un carré arrondi sauf un coin, tourné
  //    de 45° pour que ce coin pointe vers le haut. Fond surface = goutte vide.
  goutte: {
    width: GOUTTE,
    height: GOUTTE,
    marginTop: GOUTTE * 0.2,
    borderRadius: Rayon.plein,
    borderTopLeftRadius: 0,
    overflow: 'hidden',
    backgroundColor: Theme.fond.surface,
    transform: [{ rotate: '45deg' }],
  },
  redresse: {
    position: 'absolute',
    width: BOITE,
    height: BOITE,
    left: (GOUTTE - BOITE) / 2,
    top: (GOUTTE - BOITE) / 2,
    transform: [{ rotate: '-45deg' }],
  },
  remplissage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  // 📖 Contour couleur surface : la pastille se détache de la goutte qu'elle chevauche.
  puce: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: PUCE,
    height: PUCE,
    borderRadius: PUCE / 2,
    borderWidth: 2,
    borderColor: Theme.fond.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  niveau: { color: Theme.texte.secondaire, paddingHorizontal: 2 },
  points: {
    flexDirection: 'row',
    gap: Espace[1],
  },
  point: {
    width: 6,
    height: 6,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.bordure,
  },
  pointActif: {
    width: 16,
    backgroundColor: Theme.action.primaire,
  },
});
