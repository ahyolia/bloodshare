import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

// 📖 Icône affichée dans le placeholder quand la carte n'a pas d'image
// → Pourquoi une table plutôt qu'un switch : simple à lire, facile à compléter si une nouvelle catégorie de carte apparaît
const CATEGORIE_ICONS: Record<string, string> = {
  mois_don: '🩸',
  evenement: '🎪',
  parrain: '🤝',
  filleul: '🩸',
};

export default function ResultatScanScreen() {
  const router = useRouter();

  // 📖 Tous les params arrivent en string, même ceux qui étaient typés autrement côté API
  // → Pourquoi : les params de navigation transitent comme une query string, qui ne connaît que le texte
  const { type, carte_titre, carte_categorie, carte_image_url, badges } = useLocalSearchParams<{
    type: string;
    carte_titre: string;
    carte_categorie: string;
    carte_image_url: string;
    badges: string;
  }>();

  // 📖 On retombe sur un tableau vide si le JSON est absent ou invalide
  // → Pourquoi le try/catch : on ne contrôle pas totalement ce qui arrive dans ce param (chaîne vide, JSON tronqué) ;
  //   sans lui, une erreur de parsing ferait planter tout l'écran au lieu d'afficher simplement "pas de badges"
  let badgesList: { id: number; nom: string }[] = [];
  try {
    badgesList = JSON.parse((badges as string) ?? '[]');
  } catch {
    badgesList = [];
  }

  const estEvenement = type === 'evenement';
  const titre = estEvenement ? 'Présence confirmée ! 🎉' : 'Don validé ! 🩸';
  const sousTitre = estEvenement
    ? 'Merci pour votre présence, vous avez obtenu la carte Événement.'
    : `Merci beaucoup pour votre action, vous avez obtenu la carte de ${carte_titre}.`;
  const icone = CATEGORIE_ICONS[carte_categorie] ?? '🩸';

  // 📖 Valeur animée pilotant à la fois l'opacité et l'échelle de la carte, partant de 0
  // → Pourquoi une seule Animated.Value pour deux propriétés : opacity et scale doivent progresser ensemble
  //   (0 → 1) pour donner l'effet "pop" ; les piloter séparément n'apporterait rien ici et ajouterait du code
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 📖 spring simule une physique de ressort (léger dépassement puis stabilisation) plutôt qu'une interpolation linéaire
    // → Pourquoi : cet écran est le moment de récompense du flux scan → don validé → carte obtenue ;
    //   le rebond communique la satisfaction, comme l'ouverture d'un pack de cartes à collectionner
    // → useNativeDriver: true délègue l'animation au thread natif (fluide même si le JS est occupé)
    Animated.spring(anim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const cardAnimatedStyle = {
    opacity: anim,
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
      { rotate: '-3deg' },
    ],
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.titre}>{titre}</Text>
      <Text style={styles.sousTitre}>{sousTitre}</Text>

      <View style={styles.carteWrapper}>
        <Text style={styles.etoile}>✦</Text>

        <Animated.View style={[styles.carte, cardAnimatedStyle]}>
          {carte_image_url ? (
            <Image
              source={{ uri: carte_image_url }}
              style={styles.carteImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cartePlaceholder}>
              <Text style={styles.carteIcone}>{icone}</Text>
              <Text style={styles.carteTitre}>{carte_titre}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {badgesList.length > 0 && (
        <View style={styles.badgesSection}>
          <Text style={styles.badgesTitre}>🏆 Badges débloqués !</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {badgesList.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View style={styles.badgeIcone}>
                  <Text style={styles.badgeEmoji}>🏅</Text>
                </View>
                <Text style={styles.badgeNom} numberOfLines={2}>
                  {badge.nom}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.actions}>
        {/* 📖 replace et non push : on ne veut pas que l'utilisateur puisse "revenir" sur cet écran de résultat
            une fois qu'il l'a quitté (contrairement au retour vers le scanner depuis scan.tsx, où push est voulu) */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/tabs/cartes')}
        >
          <Text style={styles.primaryButtonText}>Ma collection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton} onPress={() => router.replace('/tabs')}>
          <Text style={styles.outlineButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 126,
  },
  titre: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
    marginBottom: 8,
  },
  sousTitre: {
    fontSize: 16,
    color: Colors.grisMoyen,
    textAlign: 'center',
    marginBottom: 32,
  },
  carteWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  etoile: {
    position: 'absolute',
    top: -12,
    right: -12,
    color: Colors.petrole[500],
    fontSize: 32,
    zIndex: 1,
  },
  carte: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.blanc,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: 'hidden',
  },
  carteImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  cartePlaceholder: {
    flex: 1,
    backgroundColor: Colors.creme,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  carteIcone: {
    fontSize: 40,
    marginBottom: 8,
  },
  carteTitre: {
    fontSize: 16,
    color: Colors.grisMoyen,
    textAlign: 'center',
  },
  badgesSection: {
    marginTop: 24,
    width: '100%',
  },
  badgesTitre: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.aubergine,
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeCard: {
    margin: 6,
    padding: 10,
    backgroundColor: Colors.blanc,
    borderRadius: 10,
    alignItems: 'center',
  },
  badgeIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 18,
  },
  badgeNom: {
    fontSize: 12,
    color: Colors.aubergine,
    textAlign: 'center',
    maxWidth: 80,
    marginTop: 6,
  },
  actions: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.aubergine,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.blanc,
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    width: '100%',
    backgroundColor: Colors.blanc,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: Colors.grisMoyen,
    fontSize: 16,
  },
});
