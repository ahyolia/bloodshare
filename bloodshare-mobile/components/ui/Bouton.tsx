import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';

/**
 * Bouton du design system (Figma : Aïma — Composants › Actions › Button).
 *
 * 📖 Règles d'usage du Figma : une seule `primaire` par écran ; `discret` pour
 *    « Plus tard » ; `destructif` toujours derrière une ModaleConfirmation ;
 *    libellé qui commence par un verbe (« Prendre rendez-vous »).
 * 📖 « Désactivé » n'est pas une variante mais un ÉTAT (`desactive`) : n'importe
 *    quel bouton peut l'être, par exemple tant qu'un formulaire est incomplet.
 */
export type VarianteBouton = 'primaire' | 'secondaire' | 'discret' | 'destructif' | 'validation' | 'sortie' | 'info';

type Props = {
  libelle: string;
  onPress: () => void;
  variante?: VarianteBouton;
  icone?: ComponentProps<typeof Ionicons>['name'];
  desactive?: boolean;
  /** Appel en cours : bloque le double appui et l'annonce aux lecteurs d'écran. */
  chargement?: boolean;
  /** Précise l'effet du bouton quand le libellé ne suffit pas (lecteurs d'écran). */
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const COULEURS: Record<VarianteBouton, { fond?: string; fondPresse?: string; texte: string; bordure?: string }> = {
  primaire: {
    fond: Theme.action.primaire,
    fondPresse: Theme.action.primairePresse,
    texte: Theme.action.primaireTexte,
  },
  secondaire: {
    fond: Theme.fond.surface,
    texte: Theme.action.secondaireTexte,
    bordure: Theme.action.secondaireBordure,
  },
  discret: { texte: Theme.action.discreteTexte },
  destructif: { fond: Theme.action.destructive, texte: Theme.action.primaireTexte },
  // 📖 `validation` enregistre une saisie ; `sortie` quitte (déconnexion).
  validation: {
    fond: Theme.action.validation,
    fondPresse: Theme.action.validationPresse,
    texte: Theme.action.primaireTexte,
  },
  sortie: {
    fond: Theme.action.sortie,
    fondPresse: Theme.action.sortiePresse,
    texte: Theme.action.primaireTexte,
  },
  // 📖 `info` mène vers du contenu à lire (fiches pratiques) : pétrole, la couleur des
  //    informations, plein pour bien se voir sans concurrencer l'aubergine du `primaire`.
  //    Texte blanc sur pétrole 700 : 6,2:1.
  info: {
    fond: Theme.info.icone,
    fondPresse: Theme.action.validationPresse,
    texte: Theme.action.primaireTexte,
  },
};

export function Bouton({
  libelle,
  onPress,
  variante = 'primaire',
  icone,
  desactive = false,
  chargement = false,
  accessibilityHint,
  style,
}: Props) {
  const inactif = desactive || chargement;
  const couleurs = COULEURS[variante];
  // 📖 Un bouton désactivé prend le gris du Figma quelle que soit sa variante :
  //    il doit se lire comme « pas disponible », pas comme une autre action.
  const texte = desactive ? Theme.action.desactiveTexte : couleurs.texte;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactif, busy: chargement }}
      style={({ pressed }) => [
        styles.base,
        variante === 'discret' ? styles.marginDiscret : styles.marginPleine,
        {
          backgroundColor: desactive
            ? Theme.action.desactiveFond
            : pressed && couleurs.fondPresse
              ? couleurs.fondPresse
              : couleurs.fond,
        },
        couleurs.bordure && !desactive && { borderWidth: 2, borderColor: couleurs.bordure },
        // 📖 Retour visuel à l'appui pour les variantes sans couleur « pressée » dédiée.
        pressed && !couleurs.fondPresse && !inactif && styles.presse,
        style,
      ]}
    >
      {chargement ? (
        <ActivityIndicator color={texte} />
      ) : (
        <View style={styles.contenu}>
          {icone && <Ionicons name={icone} size={20} color={texte} />}
          <Text style={[Typo.bouton, { color: texte }]} numberOfLines={1}>
            {libelle}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Rayon.plein,
    paddingVertical: Espace[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  marginPleine: { paddingHorizontal: Espace[6] },
  marginDiscret: { paddingHorizontal: Espace[4] },
  contenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
  },
  presse: { opacity: 0.8 },
});