import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Theme } from '../../constants/colors';
import { CIBLE_MIN, Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Champ de saisie (Figma : Aïma — Composants › Formulaires › TextField).
 *
 * 📖 Règles du Figma : libellé TOUJOURS visible (un placeholder disparaît dès
 *    qu'on tape) ; erreur = contour + icône + texte, jamais la couleur seule.
 * 📖 Anonymat : ce composant ne doit jamais servir à demander un nom, une date
 *    de naissance ou un groupe sanguin (règle du Figma et du projet).
 * 📖 `motDePasse` : saisie masquée par défaut + bouton œil pour l'afficher.
 * 📖 `editable={false}` (envoi en cours) : champ atténué, comme sur le Figma.
 */
type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'secureTextEntry'> & {
  libelle: string;
  aide?: string;
  /** Message d'erreur : sa présence met le champ en état d'erreur. */
  erreur?: string;
  /**
   * Contour d'erreur SANS message : quand une seule erreur concerne plusieurs
   * champs (connexion : « l'e-mail ou le mot de passe »), le message n'est
   * affiché qu'une fois, sous le dernier champ.
   */
  invalide?: boolean;
  motDePasse?: boolean;
};

const BORDURE_REPOS = 1.5;
const BORDURE_ACTIVE = 2;

export function Champ({
  libelle,
  aide,
  erreur,
  invalide = false,
  motDePasse = false,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);

  const enErreur = !!erreur || invalide;
  const inactif = props.editable === false;
  const bordure = enErreur || focus ? BORDURE_ACTIVE : BORDURE_REPOS;
  const couleurBordure = enErreur
    ? Theme.feedback.erreurTexte
    : focus
      ? Theme.formulaire.focus
      : Theme.formulaire.bordure;
  // 📖 Un contour plus épais pousse le contenu vers l'intérieur : on retire la
  //    différence de la marge pour que le texte ne « tremble » pas au focus.
  const compensation = bordure - BORDURE_REPOS;

  return (
    <View style={styles.conteneur}>
      <Text style={[Typo.corpsFort, styles.libelle]}>{libelle}</Text>

      <View
        style={[
          styles.cadre,
          {
            borderWidth: bordure,
            borderColor: couleurBordure,
            paddingLeft: Espace[4] - compensation,
            // 📖 Avec l'œil, c'est le bouton (48 px) qui fait la marge droite.
            paddingRight: motDePasse ? 0 : Espace[4] - compensation,
          },
          inactif && styles.inactif,
        ]}
      >
        <TextInput
          {...props}
          // 📖 Le libellé visible au-dessus n'est pas relié au champ pour un lecteur
          //    d'écran : on le lui donne explicitement, avec l'aide ou l'erreur en indice.
          accessibilityLabel={libelle}
          accessibilityHint={erreur ?? aide}
          aria-invalid={enErreur}
          secureTextEntry={motDePasse && !visible}
          autoCapitalize={motDePasse ? 'none' : props.autoCapitalize}
          autoCorrect={motDePasse ? false : props.autoCorrect}
          placeholderTextColor={Theme.texte.secondaire}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={[Typo.corps, styles.saisie]}
        />

        {motDePasse && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            disabled={inactif}
            style={styles.oeil}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            accessibilityState={{ disabled: inactif }}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Theme.texte.secondaire}
            />
          </Pressable>
        )}
      </View>

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
  cadre: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: CIBLE_MIN,
    // 📖 Plus arrondi qu'une carte, mais pas en pilule : la pilule reste la forme
    //    des boutons, un champ ne doit pas se confondre avec une action.
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
  },
  inactif: { opacity: 0.7 },
  saisie: {
    flex: 1,
    paddingVertical: Espace[3],
    color: Theme.texte.principal,
    // 📖 Sur web, le navigateur ajoute son propre contour de focus. On le retire :
    //    notre contour pétrole de 2 px (sur le cadre) joue ce rôle, donc le focus
    //    reste visible. Sans effet en natif.
    outlineWidth: 0,
  },
  oeil: {
    width: CIBLE_MIN,
    height: CIBLE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aide: { color: Theme.texte.secondaire },
  erreur: { flexDirection: 'row', alignItems: 'flex-start', gap: Espace[2] },
  erreurTexte: { flex: 1, color: Theme.feedback.erreurTexte },
});