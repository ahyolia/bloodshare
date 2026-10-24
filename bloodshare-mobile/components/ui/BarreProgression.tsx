import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Barre de progression (Figma : Gamification › ProgressBar).
 * - `standard` : ex. « Collection 2026 — 4 cartes sur 12 », remplissage pétrole.
 * - `surLime` : bloc vedette, ex. défi du mois, remplissage aubergine.
 * - `surPetrole` : bloc niveau, fond bleu canard (pétrole 700), texte crème ≈ 6:1.
 *   Remplissage crème (≈ 6:1 sur le fond) sur une piste crème translucide : la barre
 *   reste dans la teinte du bloc. Une barre aubergine sur le pétrole n'aurait que 2,3:1
 *   (3:1 exigé). Le pétrole pâle, essayé avant, se distinguait trop peu du fond de
 *   page ; le pétrole 500 plafonne à 3,5:1 sous du texte.
 *
 * 📖 Rôle `progressbar` + valeur : un lecteur d'écran annonce « Collection 2026,
 *    4 cartes sur 12 », pas seulement une forme colorée.
 */
type Props = {
  titre: string;
  valeur: number;
  max: number;
  /** Texte à droite (ex. « 4 cartes sur 12 »). Par défaut : le pourcentage. */
  detail?: string;
  variante?: Variante;
  /** Ajustements de mise en page (marges, espacement intérieur du bloc vedette…). */
  style?: StyleProp<ViewStyle>;
};

type Variante = 'standard' | 'surLime' | 'surPetrole';

const COULEURS: Record<Variante, { fond?: string; titre: string; detail: string; piste: string; remplissage: string }> = {
  standard: {
    titre: Theme.texte.principal,
    detail: Theme.texte.secondaire,
    piste: Theme.fond.bordure,
    remplissage: Theme.info.icone,
  },
  surLime: {
    fond: Theme.accent.signatureAplat,
    titre: Theme.accent.signatureTexte,
    detail: Theme.accent.signatureTexte,
    piste: Theme.fond.surface,
    remplissage: Theme.texte.principal,
  },
  surPetrole: {
    fond: Theme.info.icone,
    titre: Theme.texte.surAccent,
    detail: Theme.texte.surAccent,
    // Crème à 30 % d'opacité (suffixe hexadécimal 4D).
    piste: `${Theme.texte.surAccent}4D`,
    remplissage: Theme.texte.surAccent,
  },
};

export function BarreProgression({ titre, valeur, max, detail, variante = 'standard', style }: Props) {
  // 📖 Bornée entre 0 et 1 : un objectif dépassé (310 dons sur 300) ne doit pas
  //    faire déborder la barre, et un max à 0 ne doit pas diviser par zéro.
  const ratio = max > 0 ? Math.min(Math.max(valeur / max, 0), 1) : 0;
  const texteDetail = detail ?? `${Math.round(ratio * 100)} %`;
  const couleurs = COULEURS[variante];
  const vedette = couleurs.fond !== undefined;

  // 📖 La barre glisse jusqu'à sa nouvelle valeur (ex. question suivante d'un quiz) au
  //    lieu de sauter. Au premier affichage elle est déjà à sa valeur : rien ne bouge.
  //    withTiming suit le réglage « Réduire les animations » du système.
  const progression = useSharedValue(ratio);
  useEffect(() => {
    progression.value = withTiming(ratio, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [progression, ratio]);
  const styleRemplissage = useAnimatedStyle(() => ({ width: `${progression.value * 100}%` }));

  return (
    <View
      style={[styles.conteneur, vedette && [styles.vedette, { backgroundColor: couleurs.fond }], style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={titre}
      accessibilityValue={{ min: 0, max, now: Math.min(valeur, max), text: texteDetail }}
    >
      <View style={styles.entete}>
        <Text style={[Typo.corpsFort, { color: couleurs.titre }]} numberOfLines={1}>
          {titre}
        </Text>
        <Text style={[vedette ? Typo.legendeForte : Typo.legende, { color: couleurs.detail }]}>{texteDetail}</Text>
      </View>

      <View style={[styles.piste, { backgroundColor: couleurs.piste }]}>
        <Animated.View style={[styles.remplissage, { backgroundColor: couleurs.remplissage }, styleRemplissage]} />
      </View>
    </View>
  );
}

const PISTE = 12;

const styles = StyleSheet.create({
  conteneur: { gap: Espace[2], alignSelf: 'stretch' },
  // ⚠️ Marge (12) et rayon (16) du bloc vedette : déduits de la hauteur totale (68 px)
  //    et de la capture, à confirmer dans le panneau Inspect.
  vedette: {
    padding: Espace[3],
    borderRadius: Rayon.lg,
  },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Espace[2] },
  piste: { height: PISTE, borderRadius: Rayon.plein, overflow: 'hidden' },
  remplissage: { height: '100%', borderRadius: Rayon.plein },
});