import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Barre de progression (Figma : Gamification › ProgressBar).
 * - `standard` : ex. « Collection 2026 — 4 cartes sur 12 », remplissage pétrole.
 * - `surLime` : bloc vedette, ex. défi du mois, remplissage aubergine.
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
  variante?: 'standard' | 'surLime';
};

export function BarreProgression({ titre, valeur, max, detail, variante = 'standard' }: Props) {
  // 📖 Bornée entre 0 et 1 : un objectif dépassé (310 dons sur 300) ne doit pas
  //    faire déborder la barre, et un max à 0 ne doit pas diviser par zéro.
  const ratio = max > 0 ? Math.min(Math.max(valeur / max, 0), 1) : 0;
  const texteDetail = detail ?? `${Math.round(ratio * 100)} %`;
  const surLime = variante === 'surLime';

  return (
    <View
      style={[styles.conteneur, surLime && styles.surLime]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={titre}
      accessibilityValue={{ min: 0, max, now: Math.min(valeur, max), text: texteDetail }}
    >
      <View style={styles.entete}>
        <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]} numberOfLines={1}>
          {titre}
        </Text>
        <Text style={[surLime ? Typo.legendeForte : Typo.legende, { color: surLime ? Theme.texte.principal : Theme.texte.secondaire }]}>
          {texteDetail}
        </Text>
      </View>

      <View style={[styles.piste, { backgroundColor: surLime ? Theme.fond.surface : Theme.fond.bordure }]}>
        <View
          style={[
            styles.remplissage,
            { width: `${ratio * 100}%`, backgroundColor: surLime ? Theme.texte.principal : Theme.info.icone },
          ]}
        />
      </View>
    </View>
  );
}

const PISTE = 12;

const styles = StyleSheet.create({
  conteneur: { gap: Espace[2], alignSelf: 'stretch' },
  // ⚠️ Marge (12) et rayon (16) du bloc lime : déduits de la hauteur totale (68 px)
  //    et de la capture, à confirmer dans le panneau Inspect.
  surLime: {
    backgroundColor: Theme.accent.signatureAplat,
    padding: Espace[3],
    borderRadius: Rayon.lg,
  },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Espace[2] },
  piste: { height: PISTE, borderRadius: Rayon.plein, overflow: 'hidden' },
  remplissage: { height: '100%', borderRadius: Rayon.plein },
});