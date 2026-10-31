import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Badge de progression (Figma : Gamification › Badge).
 *
 * 📖 Obtenu / à débloquer se distinguent par la FORME (contour plein vs pointillé)
 *    et le remplissage, pas seulement la couleur, et le libellé vocalisé le dit.
 * 📖 Un badge récompense un palier (quiz, parrainage, défis…). Il ne doit jamais
 *    laisser croire qu'un don « rapporte » quelque chose (règle ACDO-NC).
 */
type Props = {
  nom: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  obtenu: boolean;
};

const MEDAILLE = 72;

export function Badge({ nom, icone, obtenu }: Props) {
  return (
    <View
      style={styles.badge}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${nom}, ${obtenu ? 'badge obtenu' : 'badge à débloquer'}`}
    >
      <View style={[styles.medaille, obtenu ? styles.obtenu : styles.aDebloquer]}>
        <Ionicons
          name={icone}
          size={32}
          color={obtenu ? Theme.texte.principal : Theme.texte.secondaire}
        />
      </View>
      <Text
        style={[Typo.corpsFort, styles.nom, { color: obtenu ? Theme.texte.principal : Theme.texte.secondaire }]}
        numberOfLines={2}
      >
        {nom}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 112, alignItems: 'center', gap: 6 },
  medaille: {
    width: MEDAILLE,
    height: MEDAILLE,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obtenu: {
    backgroundColor: Theme.accent.signatureAplat,
    borderWidth: 3,
    borderColor: Theme.texte.principal,
  },
  aDebloquer: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
    borderWidth: 2,
    borderColor: Theme.formulaire.bordure,
    borderStyle: 'dashed',
  },
  nom: { textAlign: 'center' },
});