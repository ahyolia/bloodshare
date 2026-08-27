import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

// 📖 Traduction de la catégorie technique (stockée en base) vers un libellé + emoji lisible par l'utilisateur
// → Pourquoi une table de correspondance plutôt qu'un switch dans le JSX : plus lisible, et facile à compléter si de nouvelles catégories de cartes apparaissent
const CATEGORIE_LABELS: Record<string, string> = {
  mois_don: '🗓 Carte du mois',
  evenement: '🎪 Carte événement',
  parrain: '🤝 Carte Parrain',
  filleul: '🩸 Carte Filleul',
};

export default function ResultatScanScreen() {
  const router = useRouter();

  // 📖 Tous les params arrivent en string (ou string[] pour Expo Router), même carte_id qui était un number côté API
  // → Pourquoi : les params de navigation transitent comme une query string, qui ne connaît que le texte
  const { type, carte_titre, carte_categorie, badges, deja_possedee } = useLocalSearchParams<{
    type: string;
    carte_titre: string;
    carte_categorie: string;
    badges: string;
    deja_possedee: string;
  }>();

  // 📖 Carte déjà possédée : le don est validé, mais pas de nouvelle carte-souvenir ni badge
  //    (les cartes du mois sont uniques, et un don ne rapporte jamais de récompense en double).
  const dejaPossedee = deja_possedee === 'true';

  // 📖 On retransforme la chaîne JSON en tableau JS ; si badges est absent (undefined), on retombe sur un tableau vide
  // → Pourquoi le fallback [] : sans lui, badgesList.length planterait si aucun badge n'a été débloqué (badges serait undefined)
  const badgesList: { id: number; nom: string }[] = badges ? JSON.parse(badges) : [];

  const titre = type === 'evenement' ? 'Présence confirmée ! 🎉' : 'Don validé ! 🩸';
  const categorieLabel = CATEGORIE_LABELS[carte_categorie] ?? carte_categorie;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={44} color={Colors.blanc} />
      </View>

      <Text style={styles.titre}>{titre}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          {dejaPossedee ? 'Carte déjà obtenue' : 'Carte obtenue'}
        </Text>
        <Text style={styles.cardTitre}>{carte_titre}</Text>
        <Text style={styles.cardCategorie}>{categorieLabel}</Text>
        {dejaPossedee && (
          <Text style={styles.dejaPossedeeNote}>
            Vous possédez déjà cette carte : elle ne peut être obtenue qu&apos;une seule fois.
            Aucun point n&apos;est attribué pour un don.
          </Text>
        )}
      </View>

      {!dejaPossedee && badgesList.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Badges débloqués 🏆</Text>
          {badgesList.map((badge) => (
            <Text key={badge.id} style={styles.badgeNom}>
              {badge.nom}
            </Text>
          ))}
        </View>
      )}

      {/* 📖 replace au lieu de push : on ne veut pas que l'utilisateur puisse "revenir" sur l'écran résultat avec le bouton retour une fois qu'il a quitté ce flux */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace('/tabs/cartes')}
      >
        <Text style={styles.primaryButtonText}>Voir ma collection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={() => router.replace('/tabs')}>
        <Text style={styles.outlineButtonText}>Retour à l&apos;accueil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  content: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 64,
    gap: 16,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.petrole[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titre: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 16,
    color: Colors.grisMoyen,
    marginBottom: 6,
  },
  cardTitre: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  cardCategorie: {
    fontSize: 14,
    color: Colors.aubergine,
    marginTop: 4,
  },
  dejaPossedeeNote: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginTop: 10,
    lineHeight: 18,
  },
  badgeNom: {
    fontSize: 15,
    color: Colors.aubergine,
    marginTop: 6,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.corail[500],
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: Colors.blanc,
    fontWeight: '700',
    fontSize: 15,
  },
  outlineButton: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.aubergine,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 15,
  },
});
