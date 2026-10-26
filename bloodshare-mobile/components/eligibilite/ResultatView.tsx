import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import {
  MESSAGE_A_VERIFIER,
  MESSAGE_DELAI,
  MESSAGE_CRITERE,
  MESSAGE_ELIGIBLE,
  ResultatEligibilite,
} from '../../constants/eligibilite';
import { Palette } from '../../constants/palette';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Confettis } from '../quiz/Confettis';
import { Bouton } from '../ui/Bouton';
import { LigneAction } from '../ui/LigneAction';

const RESERVATION_URL = 'https://www.dondusang.nc/reservation-en-ligne/';
// 📖 Page d'accueil du site du Don du Sang : coordonnées et horaires à jour, plutôt
//    qu'un numéro écrit en dur dans l'app.
const CONTACT_URL = 'https://www.dondusang.nc/';

type Props = {
  resultat: ResultatEligibilite;
  onRecommencer: () => void;
};

type Presentation = {
  titre: string;
  message: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  /** Fond et icône de la pastille : la couleur donne le ton du résultat. */
  fond: string;
  couleur: string;
};

const POUR_PETROLE = { fond: Theme.info.surface, couleur: Theme.info.icone };

// 📖 Une présentation par cas, pour que la page dise ce qui se passe vraiment : attendre
//    n'est pas la même chose qu'un critère non rempli, ou qu'un antécédent à voir avec un
//    médecin. Messages repris du Don du Sang.
const PRESENTATIONS = {
  eligible: {
    titre: 'Tu sembles pouvoir donner !',
    message: MESSAGE_ELIGIBLE,
    icone: 'heart',
    fond: Theme.feedback.succesSurface,
    couleur: Theme.feedback.succesTexte,
  },
  delai: {
    titre: 'Il vaut mieux attendre un peu',
    message: MESSAGE_DELAI,
    icone: 'time',
    fond: Palette.orange[100],
    couleur: Theme.texte.principal,
  },
  critere: {
    titre: "Ce critère n'est pas rempli",
    message: MESSAGE_CRITERE,
    icone: 'clipboard',
    ...POUR_PETROLE,
  },
  medecin: {
    titre: 'À voir avec un médecin du Don du Sang',
    message: MESSAGE_A_VERIFIER,
    icone: 'medkit',
    ...POUR_PETROLE,
  },
  a_verifier: {
    titre: 'À vérifier avec le Don du Sang',
    message: MESSAGE_A_VERIFIER,
    icone: 'help',
    ...POUR_PETROLE,
  },
} satisfies Record<string, Presentation>;

const presentationDe = (resultat: ResultatEligibilite): Presentation =>
  resultat.statut === 'bloque' ? PRESENTATIONS[resultat.question.nature] : PRESENTATIONS[resultat.statut];

const LIBELLE_REPONSE = { oui: 'Oui', non: 'Non', ne_sait_pas: 'Je ne sais pas' } as const;

const PASTILLE = 88;

// 📖 Suite directe de l'écran des questions : même cadre (croix pour quitter en haut à
//    droite, groupe centré), puis la pastille qui donne le ton, le titre, le message et,
//    dans une carte, la question concernée, la réponse donnée et ce qu'il faut savoir.
//    Une seule action pleine (aubergine), les autres discrètes. Pas de verdict « don
//    contre-indiqué » ni de date de retour : c'est la consigne du Don du Sang.
export function ResultatView({ resultat, onRecommencer }: Props) {
  const router = useRouter();
  const { titre, message, icone, fond, couleur } = presentationDe(resultat);
  const eligible = resultat.statut === 'eligible';
  const question = resultat.statut === 'eligible' ? null : resultat.question;
  const reponse =
    resultat.statut === 'bloque' ? resultat.reponse : resultat.statut === 'a_verifier' ? 'ne_sait_pas' : null;

  const apparition = (rang: number) => FadeInDown.delay(150 + rang * 80).duration(300);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={2}
          accessibilityRole="button"
          accessibilityLabel="Fermer le questionnaire"
          style={({ pressed }) => [styles.boutonRond, pressed && styles.presse]}
        >
          <Ionicons name="close" size={22} color={Theme.texte.principal} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <View style={styles.groupe}>
          <View style={styles.illustration} accessible={false}>
            {eligible && <Confettis />}
            <Animated.View
              entering={ZoomIn.springify().damping(12)}
              style={[styles.pastille, { backgroundColor: fond }]}
            >
              <Ionicons name={icone} size={40} color={couleur} />
            </Animated.View>
          </View>

          <Animated.View entering={apparition(0)} style={styles.textes}>
            <Text style={[Typo.titre2, styles.titre]} accessibilityRole="header">
              {titre}
            </Text>
            <Text style={[Typo.corps, styles.message]}>{message}</Text>
          </Animated.View>

          {question && reponse && (
            <Animated.View entering={apparition(1)} style={styles.detail}>
              <View style={styles.detailBloc}>
                <Text style={[Typo.legende, styles.detailLibelle]}>
                  Tu as répondu « {LIBELLE_REPONSE[reponse]} » à
                </Text>
                <Text style={[Typo.corpsFort, styles.detailTexte]}>{question.texte}</Text>
                {/* Sans réponse, l'explication de la question aide à y voir plus clair. */}
                {reponse === 'ne_sait_pas' && question.sous_texte && (
                  <Text style={[Typo.legende, styles.detailLibelle]}>{question.sous_texte}</Text>
                )}
              </View>
              <View style={[styles.detailBloc, styles.detailSuite]}>
                <Text style={[Typo.legendeForte, styles.aSavoir]}>À savoir</Text>
                <Text style={[Typo.corps, styles.detailTexte]}>{question.motif}</Text>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={apparition(2)} style={styles.actions}>
            {eligible ? (
              <>
                <Bouton
                  libelle="Prendre rendez-vous"
                  icone="calendar-outline"
                  onPress={() => Linking.openURL(RESERVATION_URL)}
                />
                {/* 📖 Actions secondaires en lignes à plat (LigneAction) : légères, elles ne
                    concurrencent pas l'action principale. */}
                <View style={styles.lignes}>
                  <LigneAction
                    titre="Retour à l'accueil"
                    icone="home-outline"
                    onPress={() => router.replace('/tabs')}
                  />
                </View>
              </>
            ) : (
              <>
                <Bouton
                  libelle="Contacter le Don du Sang"
                  icone="call-outline"
                  onPress={() => Linking.openURL(CONTACT_URL)}
                />
                <View style={styles.lignes}>
                  <LigneAction
                    titre="Lire les fiches pratiques"
                    sousTitre="Délais, critères et déroulement du don"
                    icone="document-text-outline"
                    onPress={() => router.push({ pathname: '/tabs/don', params: { section: 'fiches' } })}
                  />
                  <LigneAction
                    titre="Recommencer le questionnaire"
                    icone="refresh"
                    teinte="orange"
                    onPress={onRecommencer}
                  />
                </View>
              </>
            )}
          </Animated.View>
        </View>

        <Text style={[Typo.legende, styles.avertissement]}>
          {"Ce questionnaire est indicatif et ne remplace pas l'entretien médical obligatoire " +
            'avec les médecins du Don du Sang le jour du don.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const BOUTON_ROND = 44;

const styles = StyleSheet.create({
  // Même cadre que l'écran des questions.
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
  },
  boutonRond: {
    width: BOUTON_ROND,
    height: BOUTON_ROND,
    borderRadius: BOUTON_ROND / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  presse: { opacity: 0.8 },
  contenu: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: Espace[6],
  },
  // Groupe centré dans la hauteur, comme la question et ses réponses.
  groupe: {
    flex: 1,
    justifyContent: 'center',
    gap: Espace[6],
    paddingVertical: Espace[6],
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: {
    gap: Espace[2],
  },
  titre: {
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  message: {
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  // Encart d'information (pétrole soutenu, à plat) : il se détache du crème, sans
  // ombre puisqu'il ne se touche pas.
  detail: {
    padding: Espace[4],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.info.surface,
  },
  detailBloc: {
    gap: 2,
  },
  // Filet entre la question et « À savoir ».
  detailSuite: {
    marginTop: Espace[3],
    paddingTop: Espace[3],
    borderTopWidth: 1,
    borderTopColor: `${Theme.info.icone}33`, // pétrole à 20 % : visible sur l'encart pétrole
  },
  aSavoir: {
    color: Theme.info.icone,
  },
  detailLibelle: {
    color: Theme.texte.secondaire,
  },
  detailTexte: {
    color: Theme.texte.principal,
  },
  actions: {
    gap: Espace[4],
  },
  lignes: {
    marginTop: Espace[2],
  },
  avertissement: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
