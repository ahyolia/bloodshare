import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Bouton } from './Bouton';

/**
 * État vide (Figma : Retours & états › EmptyState), ex. « Ta collection t'attend ».
 *
 * 📖 Un état vide n'est jamais un cul-de-sac : il explique et propose une action
 *    (« Découvrir les quiz »). Ton encourageant, jamais culpabilisant.
 * 📖 `illustration` : la mascotte quand elle sera livrée. En attendant, une goutte
 *    dans le cercle pointillé du Figma (et jamais le texte « [MASCOTTE] »).
 */
type Props = {
  titre: string;
  message: string;
  libelleAction?: string;
  onAction?: () => void;
  illustration?: ReactNode;
};

const ILLUSTRATION = 112;

export function EtatVide({ titre, message, libelleAction, onAction, illustration }: Props) {
  return (
    <View style={styles.conteneur}>
      {/* 📖 Décorative : un lecteur d'écran passe directement au titre. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {illustration ?? (
          <View style={styles.illustration}>
            <Ionicons name="water-outline" size={40} color={Theme.texte.secondaire} />
          </View>
        )}
      </View>

      <Text style={[Typo.titre2, styles.titre]} accessibilityRole="header">
        {titre}
      </Text>
      <Text style={[Typo.corps, styles.message]}>{message}</Text>

      {libelleAction && onAction && <Bouton libelle={libelleAction} onPress={onAction} />}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    alignItems: 'center',
    gap: Espace[4], // ⚠️ estimé depuis la capture
    paddingHorizontal: Espace[6],
  },
  illustration: {
    width: ILLUSTRATION,
    height: ILLUSTRATION,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Theme.formulaire.bordure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { color: Theme.texte.principal, textAlign: 'center' },
  message: { color: Theme.texte.secondaire, textAlign: 'center' },
});