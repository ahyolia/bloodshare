import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '../../constants/palette';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Niveau d'un stock de sang (Figma : Stocks › StockChip).
 *
 * 📖 « Jamais la couleur seule » : chaque niveau a sa COULEUR, son ICÔNE et son
 *    LIBELLÉ. En niveaux de gris ou pour un daltonien, l'icône et le mot suffisent.
 */
export type NiveauStock = 'critique' | 'bas' | 'correct' | 'bon';

export const NIVEAUX: Record<
  NiveauStock,
  { libelle: string; icone: ComponentProps<typeof Ionicons>['name']; puce: string; iconePuce: string; fond: string }
> = {
  critique: { libelle: 'Critique', icone: 'alert', puce: Theme.etat.critique.jauge, iconePuce: Palette.neutre.blanc, fond: Theme.etat.critique.surface },
  bas: { libelle: 'Bas', icone: 'arrow-down', puce: Theme.etat.bas.jauge, iconePuce: Theme.texte.principal, fond: Theme.etat.bas.surface },
  correct: { libelle: 'Correct', icone: 'checkmark', puce: Theme.etat.correct.jauge, iconePuce: Palette.neutre.blanc, fond: Theme.etat.correct.surface },
  bon: { libelle: 'Bon', icone: 'heart', puce: Theme.etat.bon.jauge, iconePuce: Theme.texte.principal, fond: Theme.etat.bon.surface },
};

type Props = {
  niveau: NiveauStock;
  /** Remplace le libellé du niveau (ex. « O− · Critique »). */
  libelle?: string;
};

export function PastilleStock({ niveau, libelle }: Props) {
  const n = NIVEAUX[niveau];
  const texte = libelle ?? n.libelle;

  return (
    <View
      style={[styles.pastille, { backgroundColor: n.fond }]}
      // 📖 Lue comme un tout : « Stock critique », et non « alerte, Critique ».
      accessible
      accessibilityLabel={`Stock ${texte.toLowerCase()}`}
    >
      <View style={[styles.puce, { backgroundColor: n.puce }]}>
        <Ionicons name={n.icone} size={14} color={n.iconePuce} />
      </View>
      <Text style={[Typo.legendeForte, { color: Theme.texte.principal }]}>{texte}</Text>
    </View>
  );
}

const PUCE = 24;

const styles = StyleSheet.create({
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espace[2],
    paddingLeft: 6,
    paddingRight: Espace[3],
    paddingVertical: 6,
    borderRadius: Rayon.plein,
  },
  puce: {
    width: PUCE,
    height: PUCE,
    borderRadius: PUCE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});