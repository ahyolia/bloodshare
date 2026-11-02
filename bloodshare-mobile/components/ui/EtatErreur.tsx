import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Bouton } from './Bouton';

/**
 * État d'erreur (Figma : Retours & états › ErrorState), ex. réseau indisponible.
 *
 * 📖 Ton rassurant : « la connexion fait une pause », pas « Erreur réseau ».
 *    Le message rappelle que rien n'est perdu, et propose toujours de réessayer.
 * 📖 Annoncé dès son apparition (accessibilityLiveRegion) : la personne doit
 *    savoir que le contenu attendu n'arrivera pas.
 */
type Props = {
  onReessayer: () => void;
  titre?: string;
  message?: string;
};

const PASTILLE = 72; // ⚠️ estimé depuis la capture

export function EtatErreur({
  onReessayer,
  titre = 'La connexion fait une pause',
  message = 'Vérifie ton réseau puis réessaie. Tes cartes et tes points restent bien au chaud.',
}: Props) {
  return (
    <View style={styles.conteneur} accessibilityLiveRegion="polite">
      <View style={styles.pastille} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="cloud-offline-outline" size={32} color={Theme.feedback.erreurTexte} />
      </View>

      <Text style={[Typo.titre2, styles.titre]} accessibilityRole="header">
        {titre}
      </Text>
      <Text style={[Typo.corps, styles.message]}>{message}</Text>

      <Bouton libelle="Réessayer" icone="refresh" variante="secondaire" onPress={onReessayer} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    alignItems: 'center',
    gap: Espace[4], // ⚠️ estimé depuis la capture
    paddingHorizontal: Espace[6],
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.marque.doux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { color: Theme.texte.principal, textAlign: 'center' },
  message: { color: Theme.texte.secondaire, textAlign: 'center' },
});