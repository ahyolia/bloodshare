import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '../../../components/layout/AppHeader';
import { Colors } from '../../../constants/colors';
import { FicheInfo, getFichesInfos } from '../../../services/fichesInfos.service';

const RESERVATION_URL = 'https://www.dondusang.nc/reservation-en-ligne/';

type Category = {
  key: string;
  label: string;
  icon: 'help-circle' | 'water' | 'shield-checkmark' | 'alert-circle';
};

const CATEGORIES: Category[] = [
  { key: 'eligibilite', label: 'Éligibilité au don', icon: 'help-circle' },
  { key: 'processus_don', label: 'Processus du don', icon: 'water' },
  { key: 'apres_don', label: 'Avant et après le don', icon: 'shield-checkmark' },
  { key: 'urgences', label: 'Urgences et pénuries', icon: 'alert-circle' },
];

export default function DonScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const [fiches, setFiches] = useState<FicheInfo[]>([]);
  const [fichesLoading, setFichesLoading] = useState(true);
  const [fichesError, setFichesError] = useState(false);
  const [openCategorie, setOpenCategorie] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fichesY = useRef(0);

  useEffect(() => {
    let cancelled = false;

    getFichesInfos()
      .then((data) => {
        if (!cancelled) setFiches(data);
      })
      .catch(() => {
        if (!cancelled) setFichesError(true);
      })
      .finally(() => {
        if (!cancelled) setFichesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fichesParCategorie = (categorie: string) =>
    fiches.filter((fiche) => fiche.categorie === categorie);

  useEffect(() => {
    if (section === 'fiches' && !fichesLoading) {
      scrollRef.current?.scrollTo({ y: fichesY.current, animated: true });
    }
  }, [section, fichesLoading]);

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="Don" />

        <TouchableOpacity
          style={styles.eligibilityCard}
          onPress={() => router.push('/tabs/don/eligibilite')}
          activeOpacity={0.88}
        >
          <View style={styles.rowCenter}>
            <View style={styles.questionCircle}>
              <Text style={styles.questionCircleText}>?</Text>
            </View>
            <View style={styles.eligibilityTextContainer}>
              <Text style={styles.eligibilityTitle}>Suis-je éligible ?</Text>
              <Text style={styles.eligibilitySubtitle}>Sans données conservées (2 mins)</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.aubergine} />
          </View>
        </TouchableOpacity>

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Valider mon don</Text>

          <View style={styles.qrIllustrationWrap}>
            <Ionicons name="qr-code-outline" size={76} color={Colors.aubergine} />
          </View>

          <Text style={styles.qrText}>
            Scannez le QR Code affiché au centre ou à un événement.
          </Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/tabs/don/scan')}
            activeOpacity={0.9}
          >
            <Ionicons name="scan-outline" size={16} color={Colors.aubergine} />
            <Text style={styles.scanButtonText}>Scanner un QR Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.donationBlock}>
          <Text style={styles.sectionTitle}>Faire un don</Text>
          <Text style={styles.sectionSubtitle}>
            Réservez votre créneau horaire sur le site du Centre du Don du Sang.
          </Text>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => Linking.openURL(RESERVATION_URL)}
            activeOpacity={0.9}
          >
            <Ionicons name="calendar" size={16} color={Colors.aubergine} />
            <Text style={styles.outlineButtonText}>Prenez un rendez-vous</Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.fichesHeader}
          onLayout={(e) => {
            fichesY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Fiches pratiques</Text>
          <Text style={styles.fichesSubtitle}>
            Pour plus d&apos;informations, retrouvez des articles sur le site du{' '}
            <Text style={styles.fichesLink} onPress={() => Linking.openURL(RESERVATION_URL)}>
              Centre du Don du Sang.
            </Text>
          </Text>
        </View>

        {fichesLoading && <ActivityIndicator color={Colors.corail[600]} style={styles.loader} />}

        {!fichesLoading && fichesError && (
          <Text style={styles.errorText}>
            Impossible de charger les fiches. Réessayez plus tard.
          </Text>
        )}

        {!fichesLoading &&
          !fichesError &&
          CATEGORIES.map((categorie) => {
            const isOpen = openCategorie === categorie.key;
            const items = fichesParCategorie(categorie.key);

            return (
              <TouchableOpacity
                key={categorie.key}
                style={styles.categorieCard}
                onPress={() => setOpenCategorie(isOpen ? null : categorie.key)}
                activeOpacity={0.88}
              >
                <View style={styles.rowCenter}>
                  <View style={styles.categorieIconCircle}>
                    <Ionicons name={categorie.icon} size={18} color={Colors.grisMoyen} />
                  </View>
                  <View style={styles.categorieTextContainer}>
                    <Text style={styles.categorieTitle}>{categorie.label}</Text>
                    <Text style={styles.categorieSubtitle}>{items.length} fiches pratiques</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.aubergine}
                  />
                </View>

                {isOpen && (
                  <View style={styles.fichesList}>
                    {items.map((fiche) => (
                      <TouchableOpacity
                        key={fiche.id}
                        style={styles.ficheRow}
                        onPress={() =>
                          router.push({
                            pathname: '/tabs/don/fiche/[id]',
                            params: { id: fiche.id },
                          })
                        }
                        activeOpacity={0.9}
                      >
                        <View style={styles.ficheIconCircle}>
                          <Ionicons name="document-text" size={16} color={Colors.grisMoyen} />
                        </View>
                        <Text style={styles.ficheTitle}>{fiche.titre}</Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.grisMoyen} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingTop: 54,
    paddingBottom: 126,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eligibilityCard: {
    backgroundColor: '#F8F4EC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#403530',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  questionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.aubergine,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  questionCircleText: {
    color: Colors.cremeClair,
    fontWeight: '700',
    fontSize: 18,
  },
  eligibilityTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  eligibilityTitle: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 15,
  },
  eligibilitySubtitle: {
    color: Colors.grisMoyen,
    fontSize: 11,
    marginTop: 2,
  },
  qrCard: {
    backgroundColor: '#D9D6D1',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  qrTitle: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 18,
  },
  qrIllustrationWrap: {
    marginVertical: 18,
    width: 108,
    height: 108,
    borderRadius: 26,
    backgroundColor: '#CFCBC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    color: Colors.aubergine,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  scanButton: {
    minWidth: 188,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cremeClair,
    borderRadius: 17,
    borderWidth: 1.4,
    borderColor: '#514741',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  scanButtonText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
  donationBlock: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: Colors.aubergine,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Colors.aubergine,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  outlineButton: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: Colors.aubergine,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.cremeClair,
  },
  outlineButtonText: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  fichesHeader: {
    marginBottom: 12,
  },
  fichesSubtitle: {
    color: Colors.grisMoyen,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  fichesLink: {
    textDecorationLine: 'underline',
    color: Colors.aubergine,
    fontWeight: '700',
  },
  loader: {
    marginTop: 8,
  },
  errorText: {
    color: Colors.corail[600],
    marginTop: 8,
  },
  categorieCard: {
    backgroundColor: Colors.cremeClair,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  categorieIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0DED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categorieTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  categorieTitle: {
    color: Colors.aubergine,
    fontWeight: '700',
    fontSize: 14,
  },
  categorieSubtitle: {
    color: Colors.grisMoyen,
    fontSize: 11,
    marginTop: 2,
  },
  fichesList: {
    marginTop: 12,
  },
  ficheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2EFEB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  ficheIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0DED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ficheTitle: {
    flex: 1,
    fontSize: 12,
    color: Colors.aubergine,
    lineHeight: 16,
    marginRight: 8,
  },
});