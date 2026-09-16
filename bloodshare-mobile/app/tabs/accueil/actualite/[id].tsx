import { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Colors } from '../../../../constants/colors';
import { TAB_BAR_STYLE } from '../../_layout';

// 📖 "2026-06-01" → "1 juin 2026". timeZone UTC : la date affichée = la date
//    stockée, sans décalage selon le fuseau de l'appareil.
const formatDateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export default function ActualiteDetailScreen() {
  // 📖 Params passés par router.push depuis le carousel de l'accueil. TOUT est
  //    string (sérialisé dans l'URL). En V1 il n'y a pas de GET /actualites/{id} :
  //    on se contente des champs déjà chargés dans la liste, transmis ici.
  const { titre, chapo, contenu, published_at, image_url } = useLocalSearchParams<{
    id: string;
    titre: string;
    chapo: string;
    contenu: string;
    published_at: string;
    image_url: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();

  // 📖 On masque la tab bar flottante pendant la lecture (contenu plein écran,
  //    scrollable) et on la restaure en quittant l'écran. Même comportement que
  //    la fiche pratique du don et le détail d'un événement.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  return (
    <View style={styles.screen}>
      {/* Header fixe */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.aubergine} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {/* Bannière : image si dispo, sinon placeholder */}
      {image_url ? (
        <Image source={{ uri: image_url }} style={styles.banniere} resizeMode="cover" />
      ) : (
        <View style={styles.bannierePlaceholder}>
          <Text style={styles.banniereEmoji}>📰</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>{formatDateLongue(published_at)}</Text>
        <Text style={styles.titre}>{titre}</Text>

        {chapo ? <Text style={styles.chapo}>{chapo}</Text> : null}

        {contenu ? (
          <Text style={styles.contenu}>{contenu}</Text>
        ) : (
          <Text style={styles.contenuVide}>
            Le contenu complet de cette actualité sera bientôt disponible.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: Colors.aubergine,
    fontSize: 14,
    marginLeft: 4,
  },
  banniere: {
    width: '100%',
    height: 220,
  },
  bannierePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.creme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banniereEmoji: {
    fontSize: 64,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  date: {
    fontSize: 13,
    color: Colors.grisMoyen,
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 12,
  },
  chapo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.aubergine,
    lineHeight: 22,
    marginBottom: 12,
  },
  contenu: {
    fontSize: 15,
    color: Colors.grisMoyen,
    lineHeight: 22,
  },
  contenuVide: {
    fontSize: 15,
    color: Colors.grisMoyen,
    fontStyle: 'italic',
  },
});
