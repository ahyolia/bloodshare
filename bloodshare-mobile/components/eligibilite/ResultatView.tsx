import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import {
  MESSAGE_A_VERIFIER,
  MESSAGE_DELAI,
  MESSAGE_ELIGIBLE,
  ResultatEligibilite,
} from '../../constants/eligibilite';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Bloc } from '../ui/Bloc';
import { Bouton } from '../ui/Bouton';

const RESERVATION_URL = 'https://www.dondusang.nc/reservation-en-ligne/';
// 📖 Page d'accueil du site du Don du Sang : coordonnées et horaires à jour, plutôt
//    qu'un numéro écrit en dur dans l'app.
const CONTACT_URL = 'https://www.dondusang.nc/';

type Props = {
  resultat: ResultatEligibilite;
  onRecommencer: () => void;
};

const PRESENTATION: Record<
  ResultatEligibilite['statut'],
  { titre: string; icone: ComponentProps<typeof Ionicons>['name']; fondIcone: string }
> = {
  eligible: {
    titre: 'Tu sembles pouvoir donner !',
    icone: 'checkmark',
    fondIcone: Theme.feedback.succesSurface,
  },
  delai: {
    titre: 'Un délai est sans doute nécessaire',
    icone: 'time-outline',
    fondIcone: Theme.fond.surfaceEnfoncee,
  },
  a_verifier: {
    titre: 'À vérifier avec le Don du Sang',
    icone: 'help',
    fondIcone: Theme.fond.surfaceEnfoncee,
  },
};

// 📖 Pas de verdict « don contre-indiqué » ni de date de retour : c'est la consigne du
//    Don du Sang. L'app oriente, seuls ses médecins décident le jour du don.
export function ResultatView({ resultat, onRecommencer }: Props) {
  const router = useRouter();
  const { titre, icone, fondIcone } = PRESENTATION[resultat.statut];

  const message =
    resultat.statut === 'eligible'
      ? MESSAGE_ELIGIBLE
      : resultat.statut === 'delai'
        ? MESSAGE_DELAI
        : MESSAGE_A_VERIFIER;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contenu}>
      <View style={[styles.iconCircle, { backgroundColor: fondIcone }]}>
        <Ionicons name={icone} size={30} color={Theme.texte.principal} />
      </View>

      <Text style={[Typo.titre2, styles.titre]} accessibilityRole="header">
        {titre}
      </Text>
      <Text style={[Typo.corps, styles.texte]}>{message}</Text>

      {resultat.statut === 'delai' && <Bloc texte={resultat.motif} style={styles.bloc} />}
      {resultat.statut === 'a_verifier' && (
        <Bloc texte={`Tu as répondu « Je ne sais pas » à : ${resultat.question}`} style={styles.bloc} />
      )}

      <View style={styles.boutons}>
        {resultat.statut === 'eligible' ? (
          <>
            <Bouton
              libelle="Prendre rendez-vous"
              icone="calendar-outline"
              onPress={() => Linking.openURL(RESERVATION_URL)}
            />
            <Bouton
              libelle="Retour à l'accueil"
              variante="secondaire"
              onPress={() => router.replace('/tabs')}
            />
          </>
        ) : (
          <>
            <Bouton
              libelle="Contacter le Don du Sang"
              icone="call-outline"
              onPress={() => Linking.openURL(CONTACT_URL)}
            />
            <Bouton
              libelle="Lire les fiches pratiques"
              variante="secondaire"
              onPress={() => router.push({ pathname: '/tabs/don', params: { section: 'fiches' } })}
            />
            <Bouton libelle="Recommencer le questionnaire" variante="discret" onPress={onRecommencer} />
          </>
        )}
      </View>

      <Text style={[Typo.legende, styles.disclaimer]}>
        {"Ce questionnaire est indicatif et ne remplace pas l'entretien médical obligatoire " +
          'avec les médecins du Don du Sang le jour du don.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  contenu: {
    flexGrow: 1,
    alignItems: 'center',
    padding: Espace[6],
    paddingTop: 64,
    gap: Espace[4],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: {
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  texte: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
  },
  bloc: {
    alignSelf: 'stretch',
  },
  boutons: {
    alignSelf: 'stretch',
    gap: Espace[3],
    marginTop: Espace[2],
  },
  disclaimer: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 'auto',
    paddingTop: Espace[6],
  },
});
