import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { EnTete } from '../../../components/EnTete';
import { CarteFiche } from '../../../components/don/CarteFiche';
import { LienSite } from '../../../components/don/LienSite';
import { TuileAction } from '../../../components/don/TuileAction';
import { Bandeau, BoutonBandeau } from '../../../components/ui/Bandeau';
import { Bouton } from '../../../components/ui/Bouton';
import { Chargement } from '../../../components/ui/Chargement';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { EtatVide } from '../../../components/ui/EtatVide';
import { Filtres } from '../../../components/ui/Filtres';
import { entree } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { CATEGORIES_FICHES } from '../../../constants/fiches';
import { Espace } from '../../../constants/spacing';
import { Typo } from '../../../constants/typography';
import { useNotificationsNonLues } from '../../../hooks/useNotificationsNonLues';
import { useProfil } from '../../../hooks/useProfil';
import { useRelanceOnglet } from '../../../hooks/useRelanceOnglet';
import { FicheInfo, getFichesInfos } from '../../../services/fichesInfos.service';
import { effacerQuestionnaire, questionnaireEnCours } from '../../../stores/eligibilite.store';
import { compter } from '../../../utils/pluriel';
import { initialePseudo } from '../../../utils/profil';

const RESERVATION_URL = 'https://www.dondusang.nc/reservation-en-ligne/';
const SITE_URL = 'https://www.dondusang.nc/';
const TOUT = 'tout';

// Découpe la grille en lignes de deux cartes.
const parDeux = <T,>(elements: T[]): T[][] =>
  elements.reduce<T[][]>((lignes, element, i) => {
    if (i % 2 === 0) lignes.push([element]);
    else lignes[lignes.length - 1].push(element);
    return lignes;
  }, []);

export default function DonScreen() {
  // Appui sur l'onglet : retour en haut de la page et animations d'entrée rejouées.
  const cleOnglet = useRelanceOnglet('don');
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  // 📖 <EnTete /> ne charge rien : l'écran lui fournit pseudo + points.
  const { profil } = useProfil();
  const notificationsNonLues = useNotificationsNonLues();

  const [fiches, setFiches] = useState<FicheInfo[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [filtre, setFiltre] = useState(TOUT);
  const [questionnaire, setQuestionnaire] = useState(questionnaireEnCours);
  const scrollRef = useRef<ScrollView>(null);
  const fichesY = useRef(0);

  // 📖 Relu à chaque retour sur la page : le questionnaire a pu avancer ou se terminer.
  useFocusEffect(
    useCallback(() => {
      setQuestionnaire(questionnaireEnCours());
    }, [])
  );

  const charger = useCallback(() => {
    let annule = false;

    getFichesInfos()
      .then((donnees) => {
        if (annule) return;
        setFiches(donnees);
        setErreur(false);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });

    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => charger(), [charger]);

  // 📖 Arrivée depuis « Lire les fiches pratiques » (Quiz) : on descend jusqu'aux fiches.
  useEffect(() => {
    if (section === 'fiches' && fiches) {
      scrollRef.current?.scrollTo({ y: fichesY.current, animated: true });
    }
  }, [section, fiches]);

  // Seules les catégories qui ont des fiches publiées ont un filtre.
  const categories = CATEGORIES_FICHES.filter((categorie) =>
    fiches?.some((fiche) => fiche.categorie === categorie.cle)
  );
  // « Tout » par défaut, ou si la catégorie choisie n'a plus de fiche.
  const filtreActif = categories.some((c) => c.cle === filtre) ? filtre : TOUT;
  const fichesAffichees =
    filtreActif === TOUT ? (fiches ?? []) : (fiches ?? []).filter((fiche) => fiche.categorie === filtreActif);

  const ouvrirQuestionnaire = () => router.push('/tabs/don/eligibilite');

  return (
    <View style={styles.screen}>
      <ScrollView
        key={cleOnglet}
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <EnTete
          variante="page"
          titre="Don"
          initiale={initialePseudo(profil?.pseudo)}
          avatarId={profil?.avatar_id}
          points={profil?.points_cumules ?? 0}
          profil={profil}
          notificationsNonLues={notificationsNonLues}
          onPressNotifications={() => router.push('/notifications')}
        />

        {/* 📖 Les sections arrivent en cascade, comme sur les autres pages principales. */}
        <Animated.View entering={entree(0)}>
          <Bandeau teinte="petrole">
            {/* QR code en filigrane : on comprend d'un coup d'œil de quoi parle le bandeau. */}
            <View style={styles.qr} accessible={false}>
              <Ionicons name="qr-code-outline" size={44} color={Theme.texte.surAccent} />
            </View>
            <Text style={[Typo.titre2, styles.texteClair]} accessibilityRole="header">
              Valider mon don
            </Text>
            <Text style={[Typo.corps, styles.texteClair, styles.texteLimite]}>
              Scanne le QR code affiché au Centre de don du sang ou lors d’un événement.
            </Text>
            <BoutonBandeau
              libelle="Scanner un QR code"
              icone="scan-outline"
              onPress={() => router.push('/tabs/don/scan')}
            />
          </Bandeau>
        </Animated.View>

        <Animated.View entering={entree(1)} style={styles.section}>
          <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
            Avant de venir
          </Text>
          <View style={styles.tuiles}>
            <TuileAction
              titre="Suis-je éligible ?"
              texte={
                questionnaire
                  ? `En cours · question ${questionnaire.numero} sur ${questionnaire.total}`
                  : '15 questions · 2 min'
              }
              icone="help"
              onPress={ouvrirQuestionnaire}
              accessibilityHint={questionnaire ? 'Reprend le questionnaire là où tu l’as laissé' : undefined}
            />
            <TuileAction
              titre="Prendre rendez-vous"
              texte="Sur dondusang.nc"
              icone="calendar-outline"
              externe
              onPress={() => Linking.openURL(RESERVATION_URL)}
              accessibilityHint="Ouvre le site du Centre de don du sang"
            />
          </View>
          {questionnaire && (
            <Bouton
              libelle="Recommencer le questionnaire"
              variante="discret"
              icone="refresh"
              onPress={() => {
                effacerQuestionnaire();
                ouvrirQuestionnaire();
              }}
            />
          )}
        </Animated.View>

        <Animated.View
          entering={entree(2)}
          style={styles.section}
          onLayout={(e) => {
            fichesY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
            Fiches pratiques
          </Text>

          {!fiches && !erreur && <Chargement message="On prépare les fiches…" />}

          {!fiches && erreur && (
            <EtatErreur
              titre="Les fiches font une pause"
              message="Vérifie ton réseau puis réessaie."
              onReessayer={() => {
                setErreur(false);
                charger();
              }}
            />
          )}

          {fiches && fiches.length === 0 && (
            <EtatVide titre="Pas encore de fiche" message="De nouvelles fiches arrivent bientôt." />
          )}

          {fiches && fiches.length > 0 && (
            <>
              {/* 📖 Filtres et grille sur la page même, sans page de plus. */}
              {categories.length > 1 && (
                <Filtres
                  filtres={[
                    { cle: TOUT, libelle: 'Tout', detail: compter(fiches.length, 'fiche') },
                    ...categories.map((categorie) => ({
                      cle: categorie.cle,
                      libelle: categorie.court,
                      detail: compter(fiches.filter((f) => f.categorie === categorie.cle).length, 'fiche'),
                    })),
                  ]}
                  actif={filtreActif}
                  onChoisir={setFiltre}
                  marge={MARGE}
                />
              )}

              {/* 📖 Une clé par filtre : la grille réapparaît en fondu quand on en change. */}
              <Animated.View key={filtreActif} entering={FadeIn.duration(220)} style={styles.grille}>
                {parDeux(fichesAffichees).map((ligne, i) => (
                  // 📖 Les lignes arrivent en cascade (rang plafonné : la 10e n'attend pas 1 s).
                  <Animated.View
                    key={ligne[0].id}
                    entering={FadeInDown.delay(Math.min(i, 5) * 70).duration(300)}
                    style={styles.ligneGrille}
                  >
                    {ligne.map((fiche) => (
                      <CarteFiche
                        key={fiche.id}
                        fiche={fiche}
                        onPress={() => router.push({ pathname: '/tabs/don/fiche/[id]', params: { id: fiche.id } })}
                      />
                    ))}
                    {/* Fiche seule sur sa ligne : elle garde la largeur d'une demi-ligne. */}
                    {ligne.length === 1 && <View style={styles.caseVide} />}
                  </Animated.View>
                ))}
              </Animated.View>
            </>
          )}

          <LienSite onPress={() => Linking.openURL(SITE_URL)} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const MARGE = Espace[4];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    padding: MARGE,
    paddingTop: 54,
    paddingBottom: 126,
    gap: Espace[6],
  },
  section: {
    gap: Espace[3],
  },
  sectionTitre: {
    color: Theme.texte.principal,
  },
  texteClair: { color: Theme.texte.surAccent },
  texteLimite: { maxWidth: '80%' },
  qr: {
    position: 'absolute',
    top: Espace[6],
    right: Espace[6],
    opacity: 0.9,
  },
  tuiles: {
    flexDirection: 'row',
    gap: Espace[3],
  },
  // Un peu d'air au-dessus (après les filtres) et au-dessous (avant le lien du site).
  grille: {
    gap: Espace[3],
    marginTop: Espace[2],
    marginBottom: Espace[4],
  },
  ligneGrille: {
    flexDirection: 'row',
    gap: Espace[3],
  },
  caseVide: {
    flex: 1,
  },
});
