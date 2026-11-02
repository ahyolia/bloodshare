import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE, type TeintePastille } from '../../constants/teintes';
import { Typo } from '../../constants/typography';

type Props = {
  titre: string;
  sousTitre?: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  teinte?: TeintePastille;
  /** Lien vers un site externe : flèche « ↗ » au lieu du chevron. */
  externe?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
};

/**
 * Action secondaire légère : une ligne à plat (sans fond ni ombre), séparée par un filet
 * au-dessus, avec une pastille d'icône, un titre et un chevron (ou ↗ pour un site).
 *
 * 📖 Pour les actions de fin de page (lien vers le site, lire les fiches, recommencer) :
 *    elles ne s'ajoutent pas aux blocs de la page, tout en restant plus soignées qu'un
 *    simple bouton texte. Plusieurs lignes à la suite se lisent comme une liste.
 */
export function LigneAction({
  titre,
  sousTitre,
  icone,
  teinte = 'petrole',
  externe = false,
  onPress,
  accessibilityHint,
}: Props) {
  const pastille = TEINTES_PASTILLE[teinte];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={externe ? 'link' : 'button'}
      accessibilityLabel={sousTitre ? `${titre}, ${sousTitre}` : titre}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}
    >
      <View style={[styles.pastille, { backgroundColor: pastille.fond }]}>
        <Ionicons name={icone} size={18} color={pastille.icone} />
      </View>
      <View style={styles.textes}>
        <Text style={[Typo.corpsFort, styles.titre]}>{titre}</Text>
        {sousTitre && <Text style={[Typo.legende, styles.sousTitre]}>{sousTitre}</Text>}
      </View>
      <Ionicons name={externe ? 'open-outline' : 'chevron-forward'} size={18} color={Theme.texte.principal} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    paddingVertical: Espace[3],
    borderTopWidth: 1,
    borderTopColor: Theme.fond.bordure,
  },
  presse: { opacity: 0.6 },
  pastille: {
    width: 36,
    height: 36,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 2 },
  titre: { color: Theme.texte.principal },
  sousTitre: { color: Theme.texte.secondaire },
});
