import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Ligne de liste qui mène à un autre écran (Figma : Conteneurs › ListItem),
 * ex. « Historique des dons — 3 cartes-souvenirs collectées ».
 *
 * 📖 Le chevron annonce visuellement « ouvre un autre écran » ; pour un lecteur
 *    d'écran, c'est le rôle `button` + le libellé complet (titre + sous-titre).
 */
type Props = {
  titre: string;
  sousTitre?: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const PASTILLE = 40;

export function ElementListe({ titre, sousTitre, icone, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sousTitre ? `${titre}, ${sousTitre}` : titre}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse, style]}
    >
      <View style={styles.pastille}>
        <Ionicons name={icone} size={20} color={Theme.info.icone} />
      </View>

      <View style={styles.textes}>
        <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]} numberOfLines={1}>
          {titre}
        </Text>
        {sousTitre && (
          <Text style={[Typo.legende, { color: Theme.texte.secondaire }]} numberOfLines={1}>
            {sousTitre}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={Theme.texte.secondaire} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    minHeight: 68,
    paddingHorizontal: Espace[4],
    paddingVertical: Espace[3],
    backgroundColor: Theme.fond.surface,
    alignSelf: 'stretch',
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.md,
    backgroundColor: Theme.info.fond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 2 },
  presse: { opacity: 0.85 },
});