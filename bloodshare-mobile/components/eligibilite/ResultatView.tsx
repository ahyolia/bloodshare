import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { ResultatEligibilite } from '../../constants/eligibilite';

const RESERVATION_URL = 'https://www.dondusang.nc/reservation-en-ligne/';

type Props = {
  resultat: ResultatEligibilite;
  onRecommencer: () => void;
};

// 📖 Formate une date de retour possible en français lisible, à partir d'un délai en jours depuis aujourd'hui
// → Pourquoi ici et pas dans le hook : c'est un détail d'AFFICHAGE (format de date), pas une donnée métier — le hook n'a pas à savoir comment on la présente
const formaterDateProchaine = (delaiJours: number) => {
  const dateProchaine = new Date();
  dateProchaine.setDate(dateProchaine.getDate() + delaiJours);
  return dateProchaine.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export function ResultatView({ resultat, onRecommencer }: Props) {
  const router = useRouter();

  if (resultat.eligible) {
    return (
      <View style={styles.screen}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={30} color={Colors.aubergine} />
        </View>

        <Text style={styles.titre}>Vous semblez éligible !</Text>
        <Text style={styles.texte}>
          D'après vos réponses, rien ne semble vous empêcher de donner votre sang. Seul le
          personnel du CHT peut confirmer votre éligibilité le jour du don.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => Linking.openURL(RESERVATION_URL)}
        >
          <Text style={styles.primaryButtonText}>Prendre un rendez-vous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/tabs')}>
          <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>

        <Disclaimer />
      </View>
    );
  }

  if (resultat.type === 'temporaire') {
    const dateFormatee =
      resultat.delai_jours !== undefined && resultat.delai_jours > 0
        ? formaterDateProchaine(resultat.delai_jours)
        : null;

    return (
      <View style={styles.screen}>
        <View style={styles.iconCircle}>
          <Ionicons name="alert" size={28} color={Colors.aubergine} />
        </View>

        <Text style={styles.titreSecondaire}>Report temporaire probable</Text>
        <Text style={styles.texte}>{resultat.motif}</Text>

        {dateFormatee && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Vous pourriez donner à partir du :</Text>
            <Text style={styles.cardDate}>{dateFormatee}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/tabs/don')}>
          <Text style={styles.primaryButtonText}>Lire les fiches pratiques</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/tabs')}>
          <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.textButton} onPress={onRecommencer}>
          <Text style={styles.textButtonText}>Recommencer le questionnaire</Text>
        </TouchableOpacity>

        <Disclaimer />
      </View>
    );
  }

  // 📖 Dernier cas restant : type === 'definitive'
  return (
    <View style={styles.screen}>
      <View style={styles.iconCircle}>
        <Ionicons name="close" size={30} color={Colors.aubergine} />
      </View>

      <Text style={styles.titreSecondaire}>Don contre-indiqué</Text>
      <Text style={styles.texte}>{resultat.motif}</Text>
      <Text style={styles.texteEncourageant}>
        Vous pouvez toujours soutenir l'association ACDO-NC en sensibilisant votre entourage ou en
        devenant bénévole.
      </Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/tabs')}>
        <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.textButton} onPress={onRecommencer}>
        <Text style={styles.textButtonText}>Recommencer</Text>
      </TouchableOpacity>

      <Disclaimer />
    </View>
  );
}

// 📖 Rappel légal/médical répété sur les 3 variantes de résultat : ce questionnaire ne remplace jamais l'avis du personnel du CHT
function Disclaimer() {
  return (
    <Text style={styles.disclaimer}>
      Ce questionnaire est indicatif et ne remplace pas l'entretien médical obligatoire avec le
      personnel du CHT le jour du don.
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
    alignItems: 'center',
    padding: 24,
    paddingTop: 64,
    gap: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.aubergine,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titre: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  titreSecondaire: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
  },
  texte: {
    color: Colors.grisMoyen,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
  },
  texteEncourageant: {
    color: Colors.petrole[500],
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    color: Colors.aubergine,
    fontSize: 14,
  },
  cardDate: {
    color: Colors.corail[600],
    fontWeight: '700',
    fontSize: 18,
    marginTop: 4,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.aubergine,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: Colors.cremeClair,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#E2DFD8',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 15,
  },
  textButton: {
    paddingVertical: 6,
  },
  textButtonText: {
    color: Colors.aubergine,
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.grisMoyen,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 'auto',
    paddingTop: 20,
  },
});
