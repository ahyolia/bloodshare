import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../../constants/colors';
import { TAB_BAR_STYLE } from '../../_layout';
import { FicheInfo, getFicheInfo } from '../../../../services/fichesInfos.service';

const CATEGORY_LABELS: Record<string, string> = {
  eligibilite: 'Éligibilité au don',
  processus_don: 'Processus du don',
  apres_don: 'Avant et après le don',
  urgences: 'Urgences et pénuries',
};

function LeSaviezVous({ texte }: { texte: string }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.saviezCard}>
      <TouchableOpacity
        style={styles.saviezHeader}
        onPress={() => setOpen((value) => !value)}
        activeOpacity={0.85}
      >
        <Text style={styles.saviezTitle}>Le saviez-vous ?</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.aubergine}
        />
      </TouchableOpacity>

      {open && <Text style={styles.saviezText}>{texte}</Text>}
    </View>
  );
}

export default function FicheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [fiche, setFiche] = useState<FicheInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 📖 Même logique que sur l'écran scanner : on masque la tab bar pendant la lecture, on la restaure en quittant l'écran
  // → Pourquoi : une fiche pratique est un contenu à lire en plein écran (potentiellement long, avec scroll) ; la tab bar flottante par-dessus le texte gênerait la lecture sans apporter d'utilité ici
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

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
        <ScrollView contentContainerStyle={styles.readingContent} showsVerticalScrollIndicator={false}>
          {CATEGORY_LABELS[fiche.categorie] && (
            <Text style={styles.categoryBadge}>{CATEGORY_LABELS[fiche.categorie]}</Text>
          )}

          <Text style={styles.title}>{fiche.titre}</Text>

          {fiche.contenu && <Text style={styles.intro}>{fiche.contenu}</Text>}

          {fiche.sections?.map((section) => (
            <View key={section.titre} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.titre}</Text>

              {section.items.map((item) => (
                <View key={item.titre} style={styles.bulletRow}>
                  <View style={styles.dot} />
                  <View style={styles.bulletTextContainer}>
                    <Text style={styles.bulletTitle}>{item.titre}</Text>
                    <Text style={styles.bulletDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {fiche.a_eviter && fiche.a_eviter.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Ce qu&apos;il faut éviter avant le don</Text>

              {fiche.a_eviter.map((item) => (
                <View key={item} style={styles.eviterRow}>
                  <Text style={styles.eviterIcon}>✕</Text>
                  <Text style={styles.eviterText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {fiche.quiz_cta && (
            <View style={styles.quizCard}>
              <Text style={styles.quizTitle}>Tester ses connaissances</Text>
              <Text style={styles.quizText}>
                Vous pensez tout savoir sur le don du sang ? Testez vos connaissances et gagnez
                des points !
              </Text>

              <TouchableOpacity
                style={styles.quizButton}
                onPress={() => router.push('/tabs/quiz')}
                activeOpacity={0.9}
              >
                <Text style={styles.quizButtonText}>Faire le questionnaire</Text>
              </TouchableOpacity>
            </View>
          )}

          {fiche.le_saviez_vous && <LeSaviezVous texte={fiche.le_saviez_vous} />}
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
  readingContent: {
    paddingHorizontal: 18,
    paddingBottom: 126,
  },
  text: {
    color: Colors.aubergine,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  title: {
    color: Colors.aubergine,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 10,
  },
  loader: {
    marginTop: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    color: Colors.grisMoyen,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  intro: {
    color: Colors.grisMoyen,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: Colors.cremeClair,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.aubergine,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.corail[600],
    marginTop: 7,
    marginRight: 10,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletTitle: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 14,
  },
  bulletDescription: {
    color: Colors.grisMoyen,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  eviterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eviterIcon: {
    color: Colors.corail[600],
    fontWeight: '700',
    fontSize: 13,
    marginRight: 10,
    marginTop: 1,
  },
  eviterText: {
    flex: 1,
    color: Colors.aubergine,
    fontSize: 14,
    lineHeight: 19,
  },
  quizCard: {
    backgroundColor: Colors.aubergine,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  quizTitle: {
    color: Colors.cremeClair,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  quizText: {
    color: '#D9D0D3',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  quizButton: {
    backgroundColor: Colors.cremeClair,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quizButtonText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 14,
  },
  saviezCard: {
    backgroundColor: Colors.cremeClair,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  saviezHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saviezTitle: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 15,
  },
  saviezText: {
    color: Colors.grisMoyen,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
});
