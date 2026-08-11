import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../../constants/colors';
import { FicheInfo, getFicheInfo } from '../../../../services/fichesInfos.service';

export default function FicheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [fiche, setFiche] = useState<FicheInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getFicheInfo(Number(id))
      .then((data) => {
        if (!cancelled) setFiche(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.aubergine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fiche pratique</Text>
      </View>

      {loading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

      {!loading && (error || !fiche) && (
        <View style={styles.content}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.aubergine} />
          <Text style={styles.text}>Impossible de charger cette fiche.</Text>
        </View>
      )}

      {!loading && fiche && (
        <ScrollView contentContainerStyle={styles.content}>
          <Ionicons name="document-text-outline" size={48} color={Colors.aubergine} />
          <Text style={styles.title}>{fiche.titre}</Text>
          <Text style={styles.text}>{fiche.contenu}</Text>
        </ScrollView>
      )}
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
    paddingBottom: 16,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.aubergine,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  text: {
    color: Colors.aubergine,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  title: {
    color: Colors.aubergine,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  loader: {
    marginTop: 24,
  },
});
