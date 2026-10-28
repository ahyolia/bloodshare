import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { EnTeteContenu } from '../../../components/accueil/EnTeteContenu';
import { Bandeau, BoutonBandeau } from '../../../components/ui/Bandeau';
import { Bouton } from '../../../components/ui/Bouton';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { TexteDocument } from '../../../components/ui/TexteDocument';
import { entreeSousPage } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { Espace, Rayon } from '../../../constants/spacing';
import { TEINTES_PASTILLE, TEINTES_VIVES, type TeintePastille } from '../../../constants/teintes';
import { Typo } from '../../../constants/typography';
import { dateEvenementLongue, etiquetteProchainement, horaireEvenement } from '../../../utils/accueil';

export default function EvenementDetailScreen() {
  // 📖 Params passés par router.push depuis l'accueil. TOUT est string (sérialisé
  //    dans l'URL). En V1 il n'y a pas de GET /evenements/{id} : on se contente
  //    des champs déjà chargés dans la liste, transmis ici.
  const { titre, description, date_heure, horaire_fin, lieu, image_url } = useLocalSearchParams<{
    id: string;
    titre: string;
    description: string;
    date_heure: string;
    horaire_fin: string;
    lieu: string;
    image_url: string;
  }>();
  const router = useRouter();

  const bientot = date_heure ? etiquetteProchainement(date_heure) : null;
  const horaire = date_heure
    ? horaire_fin
      ? horaireEvenement(date_heure, horaire_fin)
      : `À partir de ${horaireEvenement(date_heure)}`
    : '';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre="Événement" />

        <Animated.View entering={entreeSousPage} style={styles.corps}>
          <EnTeteContenu
            titre={titre ?? ''}
            teinte="petrole"
            icone="calendar"
            pilules={bientot ? [{ icone: 'sparkles-outline', texte: bientot }] : []}
            imageUrl={image_url || undefined}
          />

          {/* 📖 Quand et où : une information, donc à plat (contour fin, sans ombre). */}
          <View style={styles.infos}>
            <LigneInfo icone="calendar-outline" teinte="petrole" texte={dateEvenementLongue(date_heure ?? '')} />
            <View style={styles.filet} />
            <LigneInfo icone="time-outline" teinte="orange" texte={horaire} />
            <View style={styles.filet} />
            <LigneInfo icone="location-outline" teinte="corail" texte={lieu ?? ''} />
          </View>

          {!!lieu && (
            <Bouton
              libelle="Voir le lieu sur une carte"
              variante="secondaire"
              icone="map-outline"
              accessibilityHint="Ouvre le plan dans ton navigateur"
              onPress={() =>
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu)}`)
              }
            />
          )}

          {description ? (
            <TexteDocument contenu={description} variante="fiche" accent={TEINTES_VIVES.petrole} />
          ) : (
            <Text style={[Typo.corps, styles.secondaire]}>Les détails de cet événement arrivent bientôt.</Text>
          )}

          {/* 📖 Sur place, on scanne le QR code de l'événement : même bandeau pétrole que le
              scan de la page Don, avec ses gouttes. */}
          <Bandeau teinte="petrole">
            <Text style={[Typo.titre3, styles.texteClair]} accessibilityRole="header">
              Tu es sur place ?
            </Text>
            <Text style={[Typo.corps, styles.texteClair, styles.texteLimite]}>
              Scanne le QR code affiché sur place pour valider ta présence et obtenir ta carte événement.
            </Text>
            <BoutonBandeau
              libelle="Scanner le QR code"
              icone="scan-outline"
              onPress={() => router.navigate('/tabs/don/scan')}
            />
          </Bandeau>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function LigneInfo({
  icone,
  teinte,
  texte,
}: {
  icone: ComponentProps<typeof Ionicons>['name'];
  teinte: TeintePastille;
  texte: string;
}) {
  const couleurs = TEINTES_PASTILLE[teinte];
  return (
    <View style={styles.ligne}>
      <View style={[styles.pastille, { backgroundColor: couleurs.fond }]}>
        <Ionicons name={icone} size={18} color={couleurs.icone} />
      </View>
      <Text style={[Typo.corpsFort, styles.texte]}>{texte}</Text>
    </View>
  );
}

const PASTILLE = 36;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[12],
  },
  corps: {
    gap: Espace[6],
  },
  infos: {
    padding: Espace[4],
    gap: Espace[3],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filet: {
    height: 1,
    marginLeft: PASTILLE + Espace[3],
    backgroundColor: Theme.fond.bordure,
  },
  texte: { flex: 1, color: Theme.texte.principal },
  secondaire: { color: Theme.texte.secondaire },
  texteClair: { color: Theme.texte.surAccent },
  texteLimite: { maxWidth: '85%' },
});
