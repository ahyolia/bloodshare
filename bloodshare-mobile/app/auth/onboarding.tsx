import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { setOnboardingVu } from '../../utils/preferences';

/**
 * 📖 Les 3 écrans partagent la même structure : on les décrit en données et on
 *    affiche celui d'indice `index`. Ajouter ou réordonner un écran = modifier
 *    ce tableau, sans toucher à la mise en page.
 */
const ECRANS = [
  {
    titre: 'Sauve des vies en donnant ton sang',
    texte: 'Un simple geste, un impact immense pour la Nouvelle-Calédonie.',
  },
  {
    titre: 'Gagne des cartes et des badges',
    texte:
      'Réponds à des quiz, parraine tes proches, et reçois une carte-souvenir à chaque don.',
  },
  {
    titre: 'Reste au courant',
    texte:
      'Niveau des réserves par groupe sanguin, appels au don et collectes près de chez toi.',
  },
] as const;

const DERNIER = ECRANS.length - 1;

/** Cible tactile minimale (WCAG AA). */
const CIBLE_MIN = 48;

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const ecran = ECRANS[index];

  // 📖 Les 3 écrans ne sont qu'un état local : il n'y a rien dans la pile de
  //    navigation. Sans ce code, le bouton Retour physique d'Android fermerait
  //    l'app dès l'écran 2 ou 3 au lieu de revenir à l'écran précédent.
  //    `return true` = « je m'en occupe », `return false` = comportement normal
  //    (sur le 1er écran, quitter l'app est bien ce qu'on attend).
  useEffect(() => {
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      setIndex(index - 1);
      return true;
    });
    return () => abonnement.remove();
  }, [index]);

  // 📖 `replace` et non `push` : une fois l'onboarding quitté, le bouton Retour
  //    du téléphone ne doit pas y ramener.
  // 📖 Si l'enregistrement échoue, on navigue quand même : mieux vaut revoir
  //    l'onboarding au prochain lancement que rester bloqué ici.
  const terminer = async (destination: '/auth/register' | '/auth/login') => {
    try {
      await setOnboardingVu();
    } catch (error) {
      if (__DEV__) console.warn('[onboarding] mémorisation impossible :', error);
    }
    router.replace(destination);
  };

  return (
    <View style={styles.page}>
      {/* En-tête : Retour · progression · Passer */}
      <View style={styles.entete}>
        {index > 0 ? (
          <Pressable
            onPress={() => setIndex(index - 1)}
            style={styles.cible}
            accessibilityRole="button"
            accessibilityLabel="Écran précédent"
          >
            <Ionicons name="chevron-back" size={24} color={Theme.texte.principal} />
          </Pressable>
        ) : (
          <View style={styles.cible} />
        )}

        <Text
          style={styles.progression}
          accessibilityLabel={`Écran ${index + 1} sur ${ECRANS.length}`}
        >
          {index + 1} / {ECRANS.length}
        </Text>

        {index < DERNIER ? (
          <Pressable
            onPress={() => setIndex(DERNIER)}
            style={styles.cible}
            accessibilityRole="button"
            accessibilityHint="Aller directement à l'inscription ou à la connexion"
          >
            <Text style={styles.lienTexte}>Passer</Text>
          </Pressable>
        ) : (
          <View style={styles.cible} />
        )}
      </View>

      <View style={styles.contenu} accessibilityLiveRegion="polite">
        <Text style={styles.titre} accessibilityRole="header">
          {ecran.titre}
        </Text>
        <Text style={styles.texte}>{ecran.texte}</Text>
      </View>

      <View style={styles.pied}>
        {index < DERNIER ? (
          <Pressable
            onPress={() => setIndex(index + 1)}
            style={[styles.cible, styles.suivant]}
            accessibilityRole="button"
            accessibilityLabel="Écran suivant"
          >
            <Ionicons name="chevron-forward" size={24} color={Theme.action.primaireTexte} />
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => terminer('/auth/register')}
              style={[styles.bouton, styles.boutonPlein]}
              accessibilityRole="button"
            >
              <Text style={styles.boutonPleinTexte}>{"S'inscrire"}</Text>
            </Pressable>
            <Pressable
              onPress={() => terminer('/auth/login')}
              style={[styles.bouton, styles.boutonContour]}
              accessibilityRole="button"
            >
              <Text style={styles.boutonContourTexte}>Se connecter</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Theme.fond.page,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 32,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cible: {
    minWidth: CIBLE_MIN,
    minHeight: CIBLE_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progression: {
    color: Theme.texte.secondaire,
    fontSize: 14,
  },
  lienTexte: {
    color: Theme.action.secondaireTexte,
    fontSize: 16,
    fontWeight: '700',
  },
  contenu: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 12,
    paddingBottom: 32,
  },
  titre: {
    color: Theme.texte.principal,
    fontSize: 26,
    fontWeight: '700',
  },
  texte: {
    color: Theme.texte.secondaire,
    fontSize: 16,
    lineHeight: 22,
  },
  pied: {
    gap: 12,
    alignItems: 'flex-end',
  },
  suivant: {
    backgroundColor: Theme.action.primaire,
    borderRadius: 16,
  },
  bouton: {
    alignSelf: 'stretch',
    minHeight: CIBLE_MIN,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonPlein: {
    backgroundColor: Theme.action.primaire,
  },
  boutonPleinTexte: {
    color: Theme.action.primaireTexte,
    fontSize: 16,
    fontWeight: '700',
  },
  boutonContour: {
    borderWidth: 1.5,
    borderColor: Theme.action.secondaireBordure,
  },
  boutonContourTexte: {
    color: Theme.action.secondaireTexte,
    fontSize: 16,
    fontWeight: '700',
  },
});