import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

export type Filtre = {
  cle: string;
  libelle: string;
  /** Lu après le libellé par les lecteurs d'écran, ex. « 3 fiches ». */
  detail?: string;
};

type Props = {
  filtres: Filtre[];
  actif: string;
  onChoisir: (cle: string) => void;
  /** Retrait à gauche et à droite : la rangée déborde des marges de la page. */
  marge: number;
};

// 📖 Pastilles de filtre sur une rangée qui défile. Celle choisie est pleine (aubergine,
//    l'action principale de l'app), les autres blanches et bordées. Le choix est annoncé
//    par `selected`, pas seulement par la couleur.
export function Filtres({ filtres, actif, onChoisir, marge }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -marge }}
      contentContainerStyle={[styles.rangee, { paddingHorizontal: marge }]}
    >
      {filtres.map((filtre) => {
        const choisi = filtre.cle === actif;
        return (
          <Pressable
            key={filtre.cle}
            onPress={() => onChoisir(filtre.cle)}
            accessibilityRole="button"
            accessibilityLabel={filtre.detail ? `${filtre.libelle}, ${filtre.detail}` : filtre.libelle}
            accessibilityState={{ selected: choisi }}
            style={({ pressed }) => [styles.pastille, choisi && styles.choisie, pressed && styles.presse]}
          >
            <Text style={[Typo.legendeForte, choisi ? styles.texteChoisi : styles.texte]}>{filtre.libelle}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rangee: {
    gap: Espace[2],
  },
  pastille: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Espace[4],
    borderRadius: Rayon.plein,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
    backgroundColor: Theme.fond.surface,
  },
  choisie: {
    borderColor: Theme.action.primaire,
    backgroundColor: Theme.action.primaire,
  },
  presse: { opacity: 0.85 },
  texte: { color: Theme.texte.principal },
  texteChoisi: { color: Theme.action.primaireTexte },
});
