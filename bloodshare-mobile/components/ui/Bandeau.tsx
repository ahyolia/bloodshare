import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { DecorBandeau } from './DecorBandeau';

type Props = {
  children: ReactNode;
  /** `aubergine` avec des cercles (Quiz, par défaut) ou `petrole` avec des gouttes (Don). */
  teinte?: 'aubergine' | 'petrole';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// 📖 Bandeau aubergine en tête des pages principales (Quiz, Don) : il porte l'action
//    phare de la page, avec les cercles de couleur qui flottent derrière. Chaque page a son
//    bandeau : aubergine et cercles pour Quiz, pétrole foncé et gouttes pour Don (calme
//    et rassurant). Texte crème : 13:1 sur aubergine, 6,2:1 sur pétrole.
export function Bandeau({ children, teinte = 'aubergine', style, accessibilityLabel }: Props) {
  const petrole = teinte === 'petrole';
  return (
    <View style={[styles.bandeau, petrole && styles.petrole, style]} accessibilityLabel={accessibilityLabel}>
      <DecorBandeau forme={petrole ? 'goutte' : 'cercle'} />
      {children}
    </View>
  );
}

type PropsBouton = {
  libelle: string;
  accessibilityLabel?: string;
  /** Icône avant le libellé ; sans elle, un chevron après. */
  icone?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

/** Bouton crème du bandeau, calé à gauche. */
export function BoutonBandeau({ libelle, accessibilityLabel, icone, onPress }: PropsBouton) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? libelle}
      style={({ pressed }) => [styles.bouton, pressed && styles.presse]}
    >
      {icone && <Ionicons name={icone} size={18} color={Theme.texte.principal} />}
      <Text style={[Typo.bouton, styles.boutonTexte]}>{libelle}</Text>
      {!icone && <Ionicons name="chevron-forward" size={18} color={Theme.texte.principal} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    backgroundColor: Theme.action.primaire,
    borderRadius: Rayon.lg,
    padding: Espace[6],
    gap: Espace[2],
    overflow: 'hidden',
  },
  petrole: { backgroundColor: Theme.info.icone },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espace[1],
    marginTop: Espace[2],
    paddingVertical: Espace[2],
    paddingHorizontal: Espace[4],
    borderRadius: Rayon.plein,
    backgroundColor: Theme.texte.surAccent,
  },
  boutonTexte: { color: Theme.texte.principal },
  presse: { opacity: 0.85 },
});
