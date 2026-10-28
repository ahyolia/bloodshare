import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { CIBLE_MIN, Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Choix unique en cartes radio (maquettes Inscription 2 et 3).
 *
 * 📖 Jamais la couleur seule : une carte choisie a un contour plus épais, un rond
 *    rempli ET un fond rose. Chaque repère suffit à lui seul.
 * 📖 Générique : `ChoixUnique<'homme' | 'femme'>` → TypeScript refuse une valeur
 *    qui n'est pas une des options.
 */
type Option<T extends string> = { valeur: T; libelle: string };

type Props<T extends string> = {
  libelle: string;
  options: Option<T>[];
  valeur: T | null;
  onChange: (valeur: T) => void;
  /** `ligne` : cartes côte à côte (2 options courtes) ; `colonne` : empilées. */
  disposition?: 'ligne' | 'colonne';
  erreur?: string;
};

export function ChoixUnique<T extends string>({
  libelle,
  options,
  valeur,
  onChange,
  disposition = 'colonne',
  erreur,
}: Props<T>) {
  return (
    <View style={styles.conteneur}>
      <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>{libelle}</Text>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={libelle}
        style={[styles.options, disposition === 'ligne' && styles.ligne]}
      >
        {options.map((option) => {
          const choisi = option.valeur === valeur;
          return (
            <Pressable
              key={option.valeur}
              onPress={() => onChange(option.valeur)}
              accessibilityRole="radio"
              accessibilityLabel={option.libelle}
              accessibilityState={{ checked: choisi }}
              style={({ pressed }) => [
                styles.carte,
                disposition === 'ligne' && styles.carteLigne,
                choisi ? styles.carteChoisie : styles.carteRepos,
                pressed && styles.presse,
              ]}
            >
              <View style={[styles.rond, choisi && styles.rondChoisi]}>
                {choisi && <View style={styles.point} />}
              </View>
              <Text
                style={[choisi ? Typo.corpsFort : Typo.corps, styles.texte]}
                numberOfLines={2}
              >
                {option.libelle}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 📖 Ternaire et non `erreur && …` : une erreur vide ('') serait rendue telle quelle
          hors d'un <Text>, et React Native planterait sur iOS et Android. */}
      {erreur ? (
        <View style={styles.erreur} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={18} color={Theme.feedback.erreurTexte} />
          <Text style={[Typo.legendeForte, styles.erreurTexte]}>{erreur}</Text>
        </View>
      ) : null}
    </View>
  );
}

const ROND = 20;

const styles = StyleSheet.create({
  conteneur: { gap: Espace[2], alignSelf: 'stretch' },
  options: { gap: Espace[3] },
  ligne: { flexDirection: 'row' },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    minHeight: CIBLE_MIN,
    paddingHorizontal: Espace[4],
    paddingVertical: Espace[3],
    borderRadius: Rayon.md,
  },
  carteLigne: { flex: 1 },
  carteRepos: {
    borderWidth: 1.5,
    borderColor: Theme.formulaire.bordure,
    backgroundColor: Theme.fond.surface,
  },
  carteChoisie: {
    borderWidth: 2,
    borderColor: Theme.texte.principal,
    backgroundColor: Theme.marque.doux,
    paddingHorizontal: Espace[4] - 0.5,
  },
  rond: {
    width: ROND,
    height: ROND,
    borderRadius: ROND / 2,
    borderWidth: 2,
    borderColor: Theme.formulaire.bordure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rondChoisi: { borderColor: Theme.texte.principal },
  point: { width: ROND / 2, height: ROND / 2, borderRadius: ROND / 4, backgroundColor: Theme.texte.principal },
  texte: { flex: 1, color: Theme.texte.principal },
  presse: { opacity: 0.85 },
  erreur: { flexDirection: 'row', alignItems: 'flex-start', gap: Espace[2] },
  erreurTexte: { flex: 1, color: Theme.feedback.erreurTexte },
});