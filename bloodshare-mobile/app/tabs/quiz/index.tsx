import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EnTete } from '../../../components/EnTete';
import { BandeauQuiz } from '../../../components/quiz/BandeauQuiz';
import { LigneQuiz } from '../../../components/quiz/LigneQuiz';
import { TuileCategorie } from '../../../components/quiz/TuileCategorie';
import { Bouton } from '../../../components/ui/Bouton';
import { CarteChiffre } from '../../../components/ui/CarteChiffre';
import { Chargement } from '../../../components/ui/Chargement';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { EtatVide } from '../../../components/ui/EtatVide';
import Animated, { FadeIn } from 'react-native-reanimated';
import { entree } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { Espace } from '../../../constants/spacing';
import { Typo } from '../../../constants/typography';
import { useNotificationsNonLues } from '../../../hooks/useNotificationsNonLues';
import { useProfil } from '../../../hooks/useProfil';
import { CategorieQuiz, getQuizCategories, QuizItem } from '../../../services/quiz.service';
import { initialePseudo } from '../../../utils/profil';
import { premierQuizAFaire, progressionQuiz, quizAReprendre } from '../../../utils/quizAccueil';

export default function QuizScreen() {
  const router = useRouter();
  // 📖 <EnTete /> est purement présentationnel : c'est l'écran qui fournit les
  //    données du profil (pseudo + points), via le hook partagé.
  const { profil } = useProfil();
  const notificationsNonLues = useNotificationsNonLues();

  const [categories, setCategories] = useState<CategorieQuiz[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [categorieChoisie, setCategorieChoisie] = useState<string | null>(null);
  // Vrai dès qu'un chargement a réussi : un échec ultérieur ne doit pas masquer la liste.
  const dejaCharge = useRef(false);

  const charger = useCallback(() => {
    let cancelled = false;

    getQuizCategories()
      .then((quizData) => {
        if (cancelled) return;
        dejaCharge.current = true;
        setCategories(quizData);
        setError(false);
      })
      .catch(() => {
        if (!cancelled && !dejaCharge.current) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 📖 useFocusEffect et pas useEffect : l'onglet Quiz reste monté en arrière-plan, donc un
  //    useEffect ne se relancerait pas quand on revient de l'écran d'un quiz (terminé ou
  //    abandonné) → "Quiz en cours" et les états seraient périmés jusqu'au prochain reload.
  //    Si le rechargement échoue, on garde la liste déjà affichée.
  useFocusEffect(charger);

  const ouvrirQuiz = (quiz: QuizItem) =>
    router.push({ pathname: '/tabs/quiz/[id]', params: { id: quiz.id } });

  const aReprendre = categories ? quizAReprendre(categories) : [];
  const { moyenne, totalTermines } = categories
    ? progressionQuiz(categories)
    : { moyenne: null, totalTermines: 0 };
  // Première catégorie par défaut, ou si celle choisie a disparu entre deux chargements.
  const categorieAffichee =
    categories?.find((c) => c.categorie === categorieChoisie) ?? categories?.[0] ?? null;

  const enTete = (
    <EnTete
      variante="page"
      titre="Quiz"
      initiale={initialePseudo(profil?.pseudo)}
      avatarId={profil?.avatar_id}
      points={profil?.points_cumules ?? 0}
      profil={profil}
      notificationsNonLues={notificationsNonLues}
      onPressNotifications={() => router.push('/notifications')}
    />
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {enTete}

        {/* 📖 Chargement, erreur et liste vide : centrés dans la place sous l'en-tête. */}
        {(!categories || categories.length === 0) && (
          <View style={styles.etat}>
            {loading && !categories && <Chargement message="On prépare tes quiz…" />}

            {error && !categories && (
              <EtatErreur
                titre="Les quiz font une pause"
                message="Vérifie ton réseau puis réessaie."
                onReessayer={() => {
                  setError(false);
                  setLoading(true);
                  charger();
                }}
              />
            )}

            {categories && categories.length === 0 && (
              <EtatVide titre="Pas encore de quiz" message="De nouveaux quiz arrivent bientôt, reviens vite !" />
            )}
          </View>
        )}

        {categories && categories.length > 0 && (
          <>
            {/* 📖 Les quiz à reprendre sont dans le carrousel du bandeau, sous le titre
                « Quiz en cours » ; sans quiz commencé, le bandeau « Teste tes connaissances »
                se suffit à lui-même. */}
            {/* 📖 Les sections arrivent en cascade, comme sur les autres pages principales. */}
            <Animated.View entering={entree(0)} style={styles.section}>
              {aReprendre.length > 0 && (
                <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                  Quiz en cours
                </Text>
              )}
              <BandeauQuiz
                enCours={aReprendre}
                aCommencer={premierQuizAFaire(categories)}
                onOuvrir={ouvrirQuiz}
              />
            </Animated.View>

            <Animated.View entering={entree(1)} style={styles.section}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Catégories
              </Text>
              {/* 📖 La rangée déborde des marges de la page : on voit qu'elle défile. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.rangee}
                contentContainerStyle={styles.rangeeContenu}
              >
                {categories.map((cat) => (
                  <TuileCategorie
                    key={cat.categorie}
                    categorie={cat.categorie}
                    nbQuiz={cat.quiz.length}
                    selectionnee={cat.categorie === categorieAffichee?.categorie}
                    onPress={() => setCategorieChoisie(cat.categorie)}
                  />
                ))}
              </ScrollView>

              {/* 📖 Une clé par catégorie : la liste réapparaît en fondu quand on change de tuile. */}
              {categorieAffichee && (
                <Animated.View
                  key={categorieAffichee.categorie}
                  entering={FadeIn.duration(220)}
                  style={styles.liste}
                >
                  {categorieAffichee.quiz.map((quiz) => (
                    <LigneQuiz
                      key={quiz.id}
                      quiz={quiz}
                      categorie={categorieAffichee.categorie}
                      onPress={() => ouvrirQuiz(quiz)}
                    />
                  ))}
                </Animated.View>
              )}
            </Animated.View>

            <Animated.View entering={entree(2)} style={[styles.section, styles.sectionProgression]}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Ta progression
              </Text>
              <View style={styles.chiffres}>
                <CarteChiffre
                  valeur={moyenne !== null ? `${moyenne.toFixed(1).replace('.', ',')}/5` : '–'}
                  libelle="Moyenne récente"
                  icone="stats-chart-outline"
                  teinte="petrole"
                  inclinaison="-2deg"
                />
                <CarteChiffre
                  valeur={String(totalTermines)}
                  libelle="Quiz terminés"
                  icone="trophy-outline"
                  teinte="mousse"
                  inclinaison="2deg"
                />
              </View>
              <Bouton
                libelle="Lire les fiches pratiques"
                variante="info"
                icone="document-text-outline"
                onPress={() => router.push({ pathname: '/tabs/don', params: { section: 'fiches' } })}
              />
            </Animated.View>
          </>
        )}
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
    // flexGrow : le contenu occupe au moins tout l'écran, pour pouvoir centrer un état.
    flexGrow: 1,
    padding: MARGE,
    paddingTop: 54,
    paddingBottom: 126,
    gap: Espace[6],
  },
  etat: {
    flex: 1,
    justifyContent: 'center',
  },
  section: {
    gap: Espace[3],
  },
  liste: {
    gap: Espace[3],
  },
  // 📖 Un peu plus d'air avant « Ta progression » : l'ombre des lignes de quiz, juste
  //    au-dessus, mange une partie de l'écart entre sections.
  sectionProgression: {
    marginTop: Espace[3],
  },
  sectionTitre: {
    color: Theme.texte.principal,
  },
  rangee: {
    marginHorizontal: -MARGE,
    // Rattrape une partie du rembourrage du bas : l'écart avec la liste reste raisonnable.
    marginBottom: -Espace[2],
  },
  rangeeContenu: {
    paddingHorizontal: MARGE,
    // 📖 De la place pour l'ombre des tuiles (décalée de 6 px, floue sur 16 px), que le
    //    ScrollView rognerait : sinon on voit une ligne nette sous la rangée.
    paddingTop: Espace[2],
    paddingBottom: Espace[6],
    gap: Espace[3],
  },
  chiffres: {
    flexDirection: 'row',
    gap: Espace[3],
    // Les cartes sont inclinées : sans cet écart, leur coin touche presque le bouton.
    marginBottom: Espace[3],
  },
});
