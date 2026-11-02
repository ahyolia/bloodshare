import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE, type TeintePastille } from '../../constants/teintes';
import { Typo } from '../../constants/typography';

/**
 * Ligne de liste qui mène à un autre écran (Figma : Conteneurs › ListItem),
 * ex. « Historique des dons — 3 cartes-souvenirs collectées ».
 *
 * 📖 Le chevron annonce visuellement « ouvre un autre écran » ; pour un lecteur
 *    d'écran, c'est le rôle `button` + le libellé complet (titre + sous-titre + valeur).
 * 📖 `teinte` : couleur de la pastille, comme les cartes de l'onboarding. L'icône
 *    garde un contraste ≥ 3:1 sur son fond (aubergine sur orange et mousse).
 */
type Props = {
  titre: string;
  sousTitre?: string;
  /** Compteur affiché avant le chevron (ex. « 3 », « 4/12 »). */
  valeur?: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  teinte?: TeintePastille;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const PASTILLE = 40;

export function ElementListe({ titre, sousTitre, valeur, icone, teinte = 'petrole', onPress, style }: Props) {
  const couleurs = TEINTES_PASTILLE[teinte];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[titre, sousTitre, valeur].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse, style]}
    >
      <View style={[styles.pastille, { backgroundColor: couleurs.fond }]}>
        <Ionicons name={icone} size={20} color={couleurs.icone} />
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

      {valeur && <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>{valeur}</Text>}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 2 },
  presse: { opacity: 0.85 },
});
