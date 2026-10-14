import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Champ de saisie (Figma : Aïma — Composants › Formulaires › TextField).
 *
 * 📖 Règles du Figma : libellé TOUJOURS visible (un placeholder disparaît dès
 *    qu'on tape) ; erreur = contour + icône + texte, jamais la couleur seule.
 * 📖 Anonymat : ce composant ne doit jamais servir à demander un nom, une date
 *    de naissance, un sexe ou un groupe sanguin (règle du Figma et du projet).
 */
type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  libelle: string;
  aide?: string;
  /** Message d'erreur : sa présence met le champ en état d'erreur. */
  erreur?: string;
};

const BORDURE_REPOS = 1.5;
const BORDURE_ACTIVE = 2;

export function Champ({ libelle, aide, erreur, onFocus, onBlur, ...props }: Props) {
  const [focus, setFocus] = useState(false);

  const bordure = erreur ? BORDURE_ACTIVE : focus ? BORDURE_ACTIVE : BORDURE_REPOS;
  const couleurBordure = erreur
    ? Theme.feedback.erreurTexte
    : focus
      ? Theme.formulaire.focus
      : Theme.formulaire.bordure;

  return (
    <View style={styles.conteneur}>
      <Text style={[Typo.corpsFort, styles.libelle]}>{libelle}</Text>

      <TextInput
        {...props}
        // 📖 Le libellé visible au-dessus n'est pas relié au champ pour un lecteur
        //    d'écran : on le lui donne explicitement, avec l'aide ou l'erreur en indice.
        accessibilityLabel={libelle}
        accessibilityHint={erreur ?? aide}
        aria-invalid={!!erreur}
        placeholderTextColor={Theme.texte.secondaire}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={[
          Typo.corps,
          styles.champ,
          {
            borderWidth: bordure,
            borderColor: couleurBordure,
            // 📖 Un contour plus épais pousse le texte vers l'intérieur : on retire
            //    la différence de la marge pour que le texte ne « tremble » pas au focus.
            paddingHorizontal: Espace[4] - (bordure - BORDURE_REPOS),
          },
        ]}
      />

      {erreur ? (
        // 📖 Annoncé dès son apparition (TalkBack, web) : sans ça, une personne
        //    aveugle ne saurait pas pourquoi le formulaire n'est pas parti.
        <View style={styles.erreur} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={18} color={Theme.feedback.erreurTexte} />
          <Text style={[Typo.legendeForte, styles.erreurTexte]}>{erreur}</Text>
        </View>
      ) : aide ? (
        <Text style={[Typo.legende, styles.aide]}>{aide}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Espace[2], alignSelf: 'stretch' },
  libelle: { color: Theme.texte.principal },
  champ: {
    minHeight: 48,
    borderRadius: Rayon.md,
    paddingVertical: Espace[3],
    backgroundColor: Theme.fond.surface,
    color: Theme.texte.principal,
    // 📖 Sur web, le navigateur ajoute son propre contour de focus par-dessus le
    //    nôtre. On le retire : notre contour pétrole de 2 px joue ce rôle, donc le
    //    focus reste visible. Sans effet en natif, où ce contour n'existe pas.
    outlineWidth: 0,
  },
  aide: { color: Theme.texte.secondaire },
  erreur: { flexDirection: 'row', alignItems: 'flex-start', gap: Espace[2] },
  erreurTexte: { flex: 1, color: Theme.feedback.erreurTexte },
});