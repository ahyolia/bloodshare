import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Bandeau, BoutonBandeau } from '../../../../components/ui/Bandeau';
import { LienSite } from '../../../../components/don/LienSite';
import { Chargement } from '../../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../../components/ui/EtatErreur';
import { TexteDocument } from '../../../../components/ui/TexteDocument';
import { entreeSousPage } from '../../../../constants/animations';
import { Theme } from '../../../../constants/colors';
import { categorieFiche } from '../../../../constants/fiches';
import { Espace, Rayon } from '../../../../constants/spacing';
import { TEINTES_VIVES } from '../../../../constants/teintes';
import { Typo } from '../../../../constants/typography';
import { FicheInfo, getFicheInfo } from '../../../../services/fichesInfos.service';
import { tempsLecture } from '../../../../utils/tempsLecture';
import { TAB_BAR_STYLE } from '../../_layout';

const SITE_URL = 'https://www.dondusang.nc/';

type Etat =
  | { statut: 'chargement' }
  | { statut: 'pret'; fiche: FicheInfo }
  | { statut: 'erreur' };

export default function FicheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [etat, setEtat] = useState<Etat>({ statut: 'chargement' });

  // 📖 Une fiche est un texte à lire en plein écran : la barre d'onglets flottante, par-
  //    dessus le texte, gênerait la lecture. Restaurée en quittant l'écran.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  const charger = useCallback(() => {
    let annule = false;

    getFicheInfo(Number(id))
      .then((fiche) => {
        if (!annule) setEtat(fiche ? { statut: 'pret', fiche } : { statut: 'erreur' });
      })
      .catch(() => {
        if (!annule) setEtat({ statut: 'erreur' });
      });

    return () => {
      annule = true;
    };
  }, [id]);

  useEffect(() => charger(), [charger]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre="Fiche pratique" />

        {etat.statut === 'chargement' && <Chargement message="On ouvre la fiche…" />}

        {etat.statut === 'erreur' && (
          <EtatErreur
            message="Impossible de charger cette fiche. Vérifie ta connexion et réessaie."
            onReessayer={() => {
              setEtat({ statut: 'chargement' });
              charger();
            }}
          />
        )}

        {etat.statut === 'pret' && (
          <Animated.View entering={entreeSousPage} style={styles.fiche}>
            <Fiche
              fiche={etat.fiche}
              onOuvrirQuiz={(quizId) => router.push({ pathname: '/tabs/quiz/[id]', params: { id: quizId } })}
              onVoirQuiz={() => router.push('/tabs/quiz')}
            />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function Fiche({
  fiche,
  onOuvrirQuiz,
  onVoirQuiz,
}: {
  fiche: FicheInfo;
  onOuvrirQuiz: (id: number) => void;
  onVoirQuiz: () => void;
}) {
  const categorie = categorieFiche(fiche.categorie);
  const quiz = fiche.quiz_lies ?? [];

  return (
    <>
      {/* 📖 En-tête coloré, comme la carte de la fiche sur la page Don : fond pastel et
          grande icône de la catégorie. À plat, sans ombre (dans l'app, ce qui est
          surélevé se touche, pas cet en-tête), sur un pastel assez soutenu pour se
          détacher du fond crème. Le titre domine ; catégorie, durée et quiz sont dans
          des pilules blanches. Aubergine sur pastel : ≥ 7:1. */}
      <View style={styles.entete}>
        <View style={[StyleSheet.absoluteFill, styles.teinte, { backgroundColor: TEINTES_VIVES[categorie.teinte] }]} />
        <View style={styles.forme} accessible={false}>
          <Ionicons name={categorie.iconePleine} size={150} color={TEINTES_VIVES[categorie.teinte]} />
        </View>
        <View style={styles.pilule}>
          <Ionicons name={categorie.icone} size={14} color={Theme.texte.principal} />
          <Text style={[Typo.legendeForte, styles.piluleTexte]}>{categorie.libelle}</Text>
        </View>
        <Text style={styles.titre} accessibilityRole="header">
          {fiche.titre}
        </Text>
        <View style={styles.pilules}>
          <View style={styles.pilule}>
            <Ionicons name="time-outline" size={14} color={Theme.texte.principal} />
            <Text style={[Typo.legendeForte, styles.piluleTexte]}>{tempsLecture(fiche.contenu)} min de lecture</Text>
          </View>
          {quiz.length > 0 && (
            <View style={styles.pilule}>
              <Ionicons name="bulb-outline" size={14} color={Theme.texte.principal} />
              <Text style={[Typo.legendeForte, styles.piluleTexte]}>Quiz</Text>
            </View>
          )}
        </View>
      </View>

      <TexteDocument contenu={fiche.contenu} variante="fiche" accent={TEINTES_VIVES[categorie.teinte]} />

      {!!fiche.le_saviez_vous && (
        // 📖 Pétrole soutenu pour se détacher du crème ; la pastille lime à l'ampoule et
        //    le titre en pétrole foncé le signalent comme une anecdote, le texte reste foncé.
        <View style={styles.saviez}>
          <View style={styles.saviezEntete}>
            <View style={styles.saviezPastille}>
              <Ionicons name="bulb" size={18} color={Theme.accent.signatureTexte} />
            </View>
            <Text style={[Typo.corpsFort, styles.saviezTitre]}>Le savais-tu ?</Text>
          </View>
          <Text style={[Typo.corps, styles.saviezTexte]}>{fiche.le_saviez_vous}</Text>
        </View>
      )}

      {/* 📖 Le quiz lié, s'il y en a un : on passe de la lecture à la pratique. Même
          bandeau aubergine que la page Quiz. Sans quiz lié, on propose la liste. */}
      {fiche.quiz_cta && (
        <Bandeau>
          <Text style={[Typo.titre3, styles.texteClair]} accessibilityRole="header">
            Teste-toi !
          </Text>
          {quiz.length > 0 ? (
            <>
              <Text style={[Typo.corps, styles.texteClair, styles.texteLimite]}>
                {quiz.length === 1
                  ? `Le quiz « ${quiz[0].titre} » reprend ce que tu viens de lire.`
                  : 'Ces quiz reprennent ce que tu viens de lire.'}
              </Text>
              {quiz.map((q) => (
                <BoutonBandeau
                  key={q.id}
                  libelle={quiz.length === 1 ? 'Faire le quiz' : q.titre}
                  accessibilityLabel={`Faire le quiz ${q.titre}`}
                  onPress={() => onOuvrirQuiz(q.id)}
                />
              ))}
            </>
          ) : (
            <>
              <Text style={[Typo.corps, styles.texteClair, styles.texteLimite]}>
                Vérifie ce que tu as retenu et gagne des points.
              </Text>
              <BoutonBandeau libelle="Voir les quiz" onPress={onVoirQuiz} />
            </>
          )}
        </Bandeau>
      )}

      <LienSite onPress={() => Linking.openURL(SITE_URL)} />
    </>
  );
}

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
  fiche: {
    gap: Espace[6],
  },
  entete: {
    gap: Espace[3],
    padding: Espace[6] - Espace[1],
    borderRadius: Rayon.lg,
    overflow: 'hidden',
    backgroundColor: Theme.fond.surface,
  },
  // Couleur vive à 22 % sur du blanc : un pastel plus soutenu que celui des pastilles,
  // qui se détache du fond crème sans ombre ni contour. Aubergine dessus : ≥ 7:1.
  teinte: {
    opacity: 0.22,
  },
  forme: {
    position: 'absolute',
    right: -30,
    bottom: -36,
    opacity: 0.3,
    transform: [{ rotate: '-12deg' }],
  },
  titre: {
    ...Typo.titre2,
    fontSize: 26,
    lineHeight: 32,
    color: Theme.texte.principal,
    // Laisse respirer l'icône à droite.
    maxWidth: '88%',
  },
  pilules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espace[2],
  },
  pilule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Espace[2],
    paddingVertical: 4,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.surface,
  },
  piluleTexte: { color: Theme.texte.principal },
  saviez: {
    gap: Espace[3],
    padding: Espace[6] - Espace[1],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.info.surface,
  },
  saviezEntete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
  },
  saviezPastille: {
    width: 32,
    height: 32,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.accent.signatureAplat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saviezTitre: {
    color: Theme.info.icone,
  },
  saviezTexte: {
    color: Theme.texte.principal,
  },
  texteClair: { color: Theme.texte.surAccent },
  texteLimite: { maxWidth: '85%' },
});
