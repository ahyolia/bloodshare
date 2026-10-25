import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { TEINTES_PASTILLE } from '../../constants/teintes';
import { Typo } from '../../constants/typography';

// 📖 Lien vers le site du Centre de don du sang, en pied de page (Don, fiches) : une
//    ligne à plat, sans fond ni ombre, séparée par un filet. Elle ne s'ajoute pas aux
//    blocs de la page, tout en restant plus soignée qu'un simple lien texte.
export function LienSite({ onPress }: { onPress: () => void }) {
  const pastille = TEINTES_PASTILLE.petrole;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel="Le site du Don du Sang, collectes, actualités et contacts"
      accessibilityHint="Ouvre dondusang.nc"
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}
    >
      <View style={[styles.pastille, { backgroundColor: pastille.fond }]}>
        <Ionicons name="globe-outline" size={20} color={pastille.icone} />
      </View>
      <View style={styles.textes}>
        <Text style={[Typo.corpsFort, styles.titre]}>Le site du Don du Sang</Text>
        <Text style={[Typo.legende, styles.texte]}>Collectes, actualités et contacts</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={Theme.texte.principal} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    paddingTop: Espace[4],
    paddingBottom: Espace[2],
    borderTopWidth: 1,
    borderTopColor: Theme.fond.bordure,
  },
  presse: { opacity: 0.6 },
  pastille: {
    width: 36,
    height: 36,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 2 },
  titre: { color: Theme.texte.principal },
  texte: { color: Theme.texte.secondaire },
});
