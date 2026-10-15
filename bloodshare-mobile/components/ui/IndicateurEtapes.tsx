import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Haut des parcours en étapes (onboarding, inscription) : Retour · progression · action.
 *
 * 📖 L'étape en cours est une PILULE, les autres des ronds : la forme suffit,
 *    sans dépendre de la couleur.
 * 📖 Les emplacements de Retour et de l'action existent même vides (48 px) :
 *    les points restent centrés d'un écran à l'autre.
 */
type Props = {
  /** Numéro de l'étape en cours, à partir de 1. */
  etape: number;
  total: number;
  onRetour?: () => void;
  libelleRetour?: string;
  /** Lien à droite, ex. « Passer ». */
  action?: { libelle: string; onPress: () => void; indice?: string };
};

const CIBLE = 48;

export function IndicateurEtapes({ etape, total, onRetour, libelleRetour = 'Retour', action }: Props) {
  return (
    <View style={styles.barre}>
      <View style={styles.cote}>
        {onRetour && (
          <Pressable
            onPress={onRetour}
            style={styles.cible}
            accessibilityRole="button"
            accessibilityLabel={libelleRetour}
          >
            <Ionicons name="chevron-back" size={24} color={Theme.texte.principal} />
          </Pressable>
        )}
      </View>

      <View style={styles.points} accessible accessibilityLabel={`Étape ${etape} sur ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={i + 1 === etape ? styles.pointActif : styles.point} />
        ))}
      </View>

      <View style={[styles.cote, styles.coteDroit]}>
        {action && (
          <Pressable
            onPress={action.onPress}
            style={styles.cible}
            accessibilityRole="button"
            accessibilityHint={action.indice}
          >
            <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>{action.libelle}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const POINT = 6;

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', alignItems: 'center', minHeight: CIBLE },
  cote: { width: 88, alignItems: 'flex-start' },
  coteDroit: { alignItems: 'flex-end' },
  cible: { minWidth: CIBLE, minHeight: CIBLE, alignItems: 'center', justifyContent: 'center' },
  points: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Espace[2] },
  point: { width: POINT, height: POINT, borderRadius: POINT / 2, backgroundColor: Theme.formulaire.bordure },
  pointActif: { width: 24, height: POINT, borderRadius: Rayon.plein, backgroundColor: Theme.texte.principal },
});