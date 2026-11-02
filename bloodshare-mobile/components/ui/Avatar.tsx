import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Police } from '../../constants/typography';
import { avatarParId } from '../../services/profil.service';
import { initialePseudo } from '../../utils/profil';

/**
 * Avatar de l'utilisateur : l'emoji choisi, sinon l'initiale du pseudo.
 *
 * 📖 Purement visuel : c'est l'élément qui l'entoure (bouton « Mon profil »,
 *    choix d'avatar…) qui porte le libellé pour les lecteurs d'écran.
 * 📖 L'emoji garde la police du système : avec Nunito Sans, certains appareils
 *    l'afficheraient en noir et blanc, voire en carré vide.
 */
type Props = {
  avatarId: number | null | undefined;
  pseudo?: string | null;
  /** Diamètre en px : la taille de l'emoji et de l'initiale en découle. */
  taille: number;
  /** Fond, bordure, ombre : chaque écran habille le cercle à sa façon. */
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ avatarId, pseudo, taille, style }: Props) {
  const avatar = avatarParId(avatarId);

  return (
    <View
      style={[styles.cercle, { width: taille, height: taille, borderRadius: taille / 2 }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {avatar ? (
        <Text style={{ fontSize: Math.round(taille * 0.5), lineHeight: Math.round(taille * 0.62) }}>
          {avatar.emoji}
        </Text>
      ) : (
        <Text style={[styles.initiale, { fontSize: Math.round(taille * 0.4) }]}>
          {initialePseudo(pseudo)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cercle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.marque.doux,
    overflow: 'hidden',
  },
  initiale: {
    fontFamily: Police.corpsGras,
    color: Theme.marque.principal,
  },
});
