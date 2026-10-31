import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { useCompteur } from '../../hooks/useCompteur';
import type { DefiActuel } from '../../services/defis.service';
import { BarreProgression } from '../ui/BarreProgression';

// 📖 Défi collectif du mois : LE bloc vedette de l'accueil, en lime (un seul par écran,
//    règle du Bloc `signature`). Le compteur monte jusqu'au chiffre atteint et la barre se
//    remplit avec lui. Il informe seulement : à plat, sans ombre.
export function BlocDefi({ defi }: { defi: DefiActuel }) {
  // Démarre après l'arrivée du bloc dans la cascade de la page.
  const compteur = useCompteur(defi.progression_actuelle, 1200, 300);
  const atteint = defi.progression_actuelle >= defi.objectif_chiffre;
  const pourcentage = defi.objectif_chiffre > 0
    ? Math.min(Math.round((defi.progression_actuelle / defi.objectif_chiffre) * 100), 100)
    : 0;

  return (
    <View style={styles.bloc}>
      {/* Trophée en filigrane, qui sort par le coin : décoratif. */}
      <View style={styles.filigrane} accessible={false} importantForAccessibility="no-hide-descendants">
        <Ionicons name="trophy" size={120} color={Theme.accent.signatureTexte} />
      </View>

      <View style={styles.etiquette}>
        <Ionicons name="people" size={14} color={Theme.accent.signatureTexte} />
        <Text style={[Typo.legendeForte, styles.texte]}>Défi collectif</Text>
      </View>

      <Text style={[Typo.titre3, styles.texte, styles.titre]}>{defi.titre}</Text>

      <Text
        style={styles.chiffres}
        accessibilityLabel={`${defi.progression_actuelle} sur ${defi.objectif_chiffre}`}
      >
        <Text style={[Typo.titre2, styles.texte]}>{compteur}</Text>
        <Text style={[Typo.legendeForte, styles.texte]}> / {defi.objectif_chiffre}</Text>
      </Text>

      <BarreProgression
        titre={`Progression du défi ${defi.titre}`}
        titreMasque
        valeur={compteur}
        max={defi.objectif_chiffre}
        detail={atteint ? 'Objectif atteint, bravo !' : `${pourcentage} %`}
        variante="surLime"
        style={styles.barre}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: {
    padding: Espace[4],
    gap: Espace[2],
    borderRadius: Rayon.lg,
    overflow: 'hidden',
    backgroundColor: Theme.accent.signatureAplat,
  },
  filigrane: {
    position: 'absolute',
    right: -18,
    top: -10,
    opacity: 0.1,
    transform: [{ rotate: '14deg' }],
  },
  etiquette: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espace[1],
    paddingHorizontal: Espace[2],
    paddingVertical: 2,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
  },
  texte: { color: Theme.accent.signatureTexte },
  titre: { maxWidth: '80%' },
  chiffres: { marginTop: Espace[1] },
  // La barre est déjà sur le lime du bloc : pas de second encadré autour.
  barre: { padding: 0 },
});
