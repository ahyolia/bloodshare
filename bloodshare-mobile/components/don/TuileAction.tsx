import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

type Props = {
  titre: string;
  texte: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  /** Lien vers un site externe : flèche « ↗ » au lieu du chevron. */
  externe?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
};

// 📖 Tuile d'action essentielle, par deux côte à côte (« Avant de venir » sur la page Don).
//    Pour qu'elle pèse sans ajouter de couleur à une page déjà colorée par les fiches, elle
//    reprend l'aubergine de l'action principale : pastille ronde de l'icône (comme sur les
//    cartes de fiche) et rond de la flèche. Surélevée : elle se touche.
export function TuileAction({ titre, texte, icone, externe = false, onPress, accessibilityHint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={externe ? 'link' : 'button'}
      accessibilityLabel={`${titre}. ${texte}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.tuile, pressed && styles.presse]}
    >
      <View style={styles.haut}>
        <View style={styles.pastille}>
          <Ionicons name={icone} size={20} color={Theme.action.primaireTexte} />
        </View>
        <View style={styles.signe} accessible={false}>
          <Ionicons
            name={externe ? 'arrow-up-outline' : 'arrow-forward'}
            size={16}
            color={Theme.action.primaire}
            style={externe && styles.flecheExterne}
          />
        </View>
      </View>
      <Text style={[Typo.titre3, styles.titre]}>{titre}</Text>
      <Text style={[Typo.legende, styles.texte]}>{texte}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tuile: {
    flex: 1,
    padding: Espace[4],
    gap: 2,
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  presse: { transform: [{ scale: 0.97 }] },
  haut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Espace[3],
  },
  pastille: {
    width: 40,
    height: 40,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.action.primaire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Rond cerné d'aubergine : on voit que la tuile mène quelque part.
  signe: {
    width: 32,
    height: 32,
    borderRadius: Rayon.plein,
    borderWidth: 1.5,
    borderColor: Theme.action.primaire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Flèche « vers l'extérieur » : la flèche vers le haut, penchée à 45°.
  flecheExterne: { transform: [{ rotate: '45deg' }] },
  titre: { color: Theme.texte.principal },
  texte: { color: Theme.texte.secondaire },
});
