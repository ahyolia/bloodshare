import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Case à cocher, avec lien optionnel dans le texte (maquette Inscription 2 :
 * « J'accepte la politique de confidentialité »).
 *
 * 📖 La CASE et le LIEN sont deux éléments distincts : un élément interactif ne doit
 *    pas en contenir un autre (sinon le lien est inaccessible au clavier et mal
 *    annoncé). Le texte coche aussi la case à l'appui, pour le confort visuel.
 */
type Props = {
  /** Texte avant le lien (ou texte entier sans lien). */
  libelle: string;
  lien?: { texte: string; onPress: () => void };
  coche: boolean;
  onChange: (coche: boolean) => void;
  erreur?: string;
};

const CASE = 22;

export function CaseACocher({ libelle, lien, coche, onChange, erreur }: Props) {
  const basculer = () => onChange(!coche);
  const phrase = lien ? `${libelle} ${lien.texte}` : libelle;

  return (
    <View style={styles.conteneur}>
      <View style={styles.ligne}>
        <Pressable
          onPress={basculer}
          accessibilityRole="checkbox"
          accessibilityLabel={phrase}
          accessibilityState={{ checked: coche }}
          style={styles.cible}
        >
          <View style={[styles.case, coche ? styles.caseCochee : styles.caseVide]}>
            {coche && <Ionicons name="checkmark" size={16} color={Theme.action.primaireTexte} />}
          </View>
        </Pressable>

        <Text
          style={[Typo.corps, styles.texte]}
          onPress={basculer}
          // 📖 Pour un lecteur d'écran, cocher passe par la case : le texte ne sert
          //    qu'à exposer le lien, il n'est pas lui-même un bouton.
          accessibilityRole={lien ? undefined : 'text'}
        >
          {libelle}
          {lien && (
            <>
              {' '}
              <Text style={styles.lien} onPress={lien.onPress} accessibilityRole="link">
                {lien.texte}
              </Text>
            </>
          )}
        </Text>
      </View>

      {erreur && (
        <View style={styles.erreur} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={18} color={Theme.feedback.erreurTexte} />
          <Text style={[Typo.legendeForte, styles.erreurTexte]}>{erreur}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Espace[1], alignSelf: 'stretch' },
  ligne: { flexDirection: 'row', alignItems: 'flex-start' },
  // 📖 Cible de 48 px autour d'une case de 22 px, décalée pour que la case reste
  //    alignée sur la première ligne du texte et sur le bord gauche du formulaire.
  cible: {
    width: 48,
    height: 48,
    marginLeft: -13,
    marginTop: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  case: {
    width: CASE,
    height: CASE,
    borderRadius: Rayon.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseVide: { borderWidth: 2, borderColor: Theme.formulaire.bordure, backgroundColor: Theme.fond.surface },
  caseCochee: { backgroundColor: Theme.texte.principal },
  texte: { flex: 1, color: Theme.texte.principal },
  lien: { color: Theme.marque.principal, textDecorationLine: 'underline' },
  erreur: { flexDirection: 'row', alignItems: 'flex-start', gap: Espace[2], paddingLeft: CASE + Espace[3] },
  erreurTexte: { flex: 1, color: Theme.feedback.erreurTexte },
});