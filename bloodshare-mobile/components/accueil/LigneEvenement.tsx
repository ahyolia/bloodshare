import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Palette } from '../../constants/palette';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import type { Evenement } from '../../services/evenements.service';
import { dateEvenement, etiquetteProchainement, horaireEvenement } from '../../utils/accueil';

type Props = {
  evenement: Evenement;
  onPress: () => void;
};

// 📖 Ligne d'un événement à venir : une pastille calendrier (jour et mois), le titre, le
//    lieu et l'horaire. Un événement de la semaine porte une étiquette « Demain », « Dans
//    3 jours »… Surélevée : elle ouvre le détail.
export function LigneEvenement({ evenement, onPress }: Props) {
  const { jour, mois, moisLong } = dateEvenement(evenement.date_heure);
  const horaire = horaireEvenement(evenement.date_heure, evenement.horaire_fin);
  const bientot = etiquetteProchainement(evenement.date_heure);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${evenement.titre}, le ${Number(jour)} ${moisLong}${bientot ? ` (${bientot.toLowerCase()})` : ''}, ${horaire.replace('→', 'à')}, ${evenement.lieu}`}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}
    >
      <View style={styles.calendrier}>
        <View style={styles.calendrierHaut}>
          <Text style={[Typo.legendeForte, styles.mois]}>{mois}</Text>
        </View>
        <Text style={[Typo.titre2, styles.texte]}>{jour}</Text>
      </View>

      <View style={styles.textes}>
        {bientot && (
          <View style={styles.etiquette}>
            <Text style={[Typo.legendeForte, styles.texte]}>{bientot}</Text>
          </View>
        )}
        <Text style={[Typo.corpsFort, styles.texte]} numberOfLines={2}>
          {evenement.titre}
        </Text>
        <View style={styles.info}>
          <Ionicons name="location-outline" size={14} color={Theme.texte.secondaire} />
          <Text style={[Typo.legende, styles.secondaire]} numberOfLines={1}>
            {evenement.lieu}
          </Text>
        </View>
        <View style={styles.info}>
          <Ionicons name="time-outline" size={14} color={Theme.texte.secondaire} />
          <Text style={[Typo.legende, styles.secondaire]}>{horaire}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={Theme.texte.secondaire} />
    </Pressable>
  );
}

const CALENDRIER = 56;

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[3],
    paddingRight: Espace[4],
    backgroundColor: Theme.fond.surface,
    borderRadius: Rayon.lg,
    ...Ombre.flottante,
  },
  presse: { opacity: 0.85 },
  // 📖 Petite page de calendrier : bandeau pétrole avec le mois (texte crème 6,2:1), le
  //    jour en grand dessous sur pétrole pâle.
  calendrier: {
    width: CALENDRIER,
    borderRadius: Rayon.md,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: Espace[1],
    backgroundColor: Theme.info.fond,
  },
  calendrierHaut: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 2,
    backgroundColor: Theme.info.icone,
  },
  mois: { color: Theme.texte.surAccent },
  textes: { flex: 1, gap: 2 },
  texte: { color: Theme.texte.principal },
  secondaire: { color: Theme.texte.secondaire, flexShrink: 1 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etiquette: {
    alignSelf: 'flex-start',
    paddingHorizontal: Espace[2],
    borderRadius: Rayon.plein,
    backgroundColor: Palette.orange[100],
    marginBottom: 2,
  },
});
