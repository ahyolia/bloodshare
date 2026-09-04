import { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Colors } from '../../../../constants/colors';
import { TAB_BAR_STYLE } from '../../_layout';

// 📖 "2026-07-02T09:00:00Z" → "09h00". timeZone UTC : on affiche l'heure telle
//    qu'elle est stockée, sans décalage selon le fuseau de l'appareil.
const formatHeure = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    .replace(':', 'h');

// 📖 Date complète en toutes lettres : "jeudi 2 juillet 2026".
const formatDateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export default function EvenementDetailScreen() {
  // 📖 Params passés par router.push depuis l'accueil. TOUT est string (sérialisé
  //    dans l'URL). En V1 il n'y a pas de GET /evenements/{id} : on se contente
  //    des champs déjà chargés dans la liste, transmis ici.
  const { titre, description, date_heure, horaire_fin, lieu, image_url } =
    useLocalSearchParams<{
      id: string;
      titre: string;
      description: string;
      date_heure: string;
      horaire_fin: string;
      lieu: string;
      image_url: string;
    }>();
  const router = useRouter();
  const navigation = useNavigation();

  // 📖 On masque la tab bar flottante pendant la lecture (contenu plein écran,
  //    scrollable, avec un CTA en bas) et on la restaure en quittant l'écran.
  //    Même comportement que la fiche pratique du don.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  const horaires = horaire_fin
    ? `${formatHeure(date_heure)} → ${formatHeure(horaire_fin)}`
    : `À partir de ${formatHeure(date_heure)}`;

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
          <Text style={styles.banniereEmoji}>🎪</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bloc date / horaires / lieu */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoDate}>{formatDateLongue(date_heure)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>{horaires}</Text>
          </View>
          <View style={styles.infoRowLast}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{lieu}</Text>
          </View>
        </View>

        <Text style={styles.titre}>{titre}</Text>

        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : (
          <Text style={styles.descriptionVide}>Aucune description disponible.</Text>
        )}

        <View style={styles.separateur} />

        {/* Valider ma présence */}
        <View style={styles.presenceCard}>
          <Text style={styles.presenceEmoji}>🩸</Text>
          <Text style={styles.presenceTitre}>Vous êtes présent ?</Text>
          <Text style={styles.presenceText}>
            Scannez le QR Code affiché sur place pour valider votre présence et obtenir votre
            carte événement.
          </Text>
          <TouchableOpacity
            style={styles.presenceBtn}
            onPress={() => router.push('/tabs/don/scan')}
            activeOpacity={0.9}
          >
            <Text style={styles.presenceBtnText}>Scanner le QR Code</Text>
          </TouchableOpacity>
        </View>
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
  infoCard: {
    backgroundColor: Colors.blanc,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  infoDate: {
    flex: 1,
    color: Colors.aubergine,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  infoText: {
    flex: 1,
    color: Colors.grisMoyen,
    fontSize: 14,
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.grisMoyen,
    lineHeight: 22,
  },
  descriptionVide: {
    fontSize: 15,
    color: Colors.grisMoyen,
    fontStyle: 'italic',
  },
  separateur: {
    height: 1,
    backgroundColor: Colors.fondGris,
    marginVertical: 16,
  },
  presenceCard: {
    backgroundColor: Colors.creme,
    borderRadius: 12,
    padding: 16,
  },
  presenceEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  presenceTitre: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  presenceText: {
    fontSize: 13,
    color: Colors.grisMoyen,
    lineHeight: 20,
    marginTop: 4,
  },
  presenceBtn: {
    backgroundColor: Colors.corail[600],
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  presenceBtnText: {
    color: Colors.blanc,
    fontSize: 14,
    fontWeight: '700',
  },
});
