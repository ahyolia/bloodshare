import { useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';

type Props = {
  imageUrl: string | null;
  /** Repli quand le badge n'a pas d'illustration (ou qu'elle ne charge pas). */
  emoji: string;
  taille: number;
  /** Badge pas encore obtenu : illustration grisée et estompée. */
  verrouille?: boolean;
};

// 📖 Illustration du badge envoyée par le backoffice (image_url), un sticker rond sur fond
//    transparent : elle remplit tout le médaillon. L'emoji de constants/badges.ts reste le
//    repli pour un badge sans visuel ou une image qui ne se charge pas (hors ligne).
export function VisuelBadge({ imageUrl, emoji, taille, verrouille = false }: Props) {
  const [enErreur, setEnErreur] = useState(false);

  if (!imageUrl || enErreur) {
    return (
      <Text style={[{ fontSize: taille / 2, lineHeight: taille * 0.62 }, verrouille && styles.estompe]}>
        {emoji}
      </Text>
    );
  }

  return (
    <Image
      testID="visuel-badge"
      source={{ uri: imageUrl }}
      onError={() => setEnErreur(true)}
      resizeMode="contain"
      // Décoratif : le nom du badge est toujours écrit à côté.
      accessibilityIgnoresInvertColors
      accessible={false}
      style={[{ width: taille, height: taille }, verrouille && styles.verrouille]}
    />
  );
}

const styles = StyleSheet.create({
  estompe: { opacity: 0.35 },
  // 📖 filter grayscale : Android et web ; iOS l'ignore et garde l'opacité seule.
  verrouille: { opacity: 0.4, filter: [{ grayscale: 1 }] },
});
