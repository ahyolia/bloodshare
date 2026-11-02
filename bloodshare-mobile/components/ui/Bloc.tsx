import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Bloc de contenu (Figma : Aïma — Composants › Conteneurs › Card).
 *
 * 📖 Nommé `Bloc` et non `Carte` : dans Aïma, une « carte » est une carte-souvenir
 *    (onglet Cartes). Le Figma le précise : « Conteneur (≠ carte-souvenir) ».
 * 📖 Règles du Figma : variante `signature` (lime) pour UN SEUL bloc vedette par
 *    écran (ex. défi du mois) ; jamais d'ombre ni de bordure gauche colorée.
 */
type Props = {
  titre?: string;
  /** Texte simple, ou contenu libre (jauge, liste…) en enfants. */
  texte?: string;
  children?: ReactNode;
  variante?: 'standard' | 'signature';
  /** Rend le bloc entier cliquable (ex. ouvrir le détail du défi). */
  onPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Bloc({ titre, texte, children, variante = 'standard', onPress, accessibilityHint, style }: Props) {
  const signature = variante === 'signature';
  const couleurTexte = signature ? Theme.accent.signatureTexte : Theme.texte.secondaire;

  const contenu = (
    <>
      {titre && (
        <Text style={[Typo.titre2, { color: Theme.texte.principal }]} accessibilityRole="header">
          {titre}
        </Text>
      )}
      {texte && <Text style={[Typo.corps, { color: couleurTexte }]}>{texte}</Text>}
      {children}
    </>
  );

  const styleBloc = [styles.base, signature ? styles.signature : styles.standard, style];

  // 📖 Un bloc n'est cliquable que si on lui donne une action : sinon, un simple
  //    View, pour qu'un lecteur d'écran ne l'annonce pas comme un bouton inutile.
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [styleBloc, pressed && styles.presse]}
      >
        {contenu}
      </Pressable>
    );
  }

  return <View style={styleBloc}>{contenu}</View>;
}

const styles = StyleSheet.create({
  base: {
    padding: Espace[4],
    gap: Espace[2],
    borderRadius: Rayon.lg,
    alignSelf: 'stretch',
  },
  standard: {
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  signature: {
    backgroundColor: Theme.accent.signatureAplat,
  },
  presse: { opacity: 0.85 },
});