import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Bouton } from '../../components/ui/Bouton';
import { FondDecoratif, type Forme } from '../../components/ui/FondDecoratif';
import { IndicateurEtapes } from '../../components/ui/IndicateurEtapes';
import {
  IllustrationCartes,
  IllustrationDon,
  IllustrationInfos,
} from '../../components/onboarding/Illustrations';
import { setOnboardingVu } from '../../utils/preferences';

/**
 * 📖 Les 3 écrans partagent la même structure : on les décrit en données et on
 *    affiche celui d'indice `index`. Ajouter ou réordonner un écran = modifier
 *    ce tableau, sans toucher à la mise en page.
 */
const ECRANS: { titre: string; texte: string; Illustration: () => React.JSX.Element; formes: Forme[] }[] = [
  {
    titre: 'Sauve des vies en donnant ton sang',
    texte: 'Un simple geste, un impact immense pour la Nouvelle-Calédonie.',
    Illustration: IllustrationDon,
    formes: [
      { type: 'ellipse', couleur: 'rose', taille: 380, etirement: 1.1, rotation: -15, position: { top: 110, left: 10 } },
      { type: 'rond', couleur: 'corail', taille: 44, position: { top: 130, right: 30 } },
      { type: 'rond', couleur: 'corailFonce', taille: 60, position: { top: 430, left: 14 } },
      { type: 'pilule', couleur: 'petrole', taille: 44, position: { top: 455, right: 50 } },
    ],
  },
  {
    titre: 'Gagne des cartes et des badges',
    texte: 'Réponds à des quiz, parraine tes proches, et reçois une carte-souvenir à chaque don.',
    Illustration: IllustrationCartes,
    formes: [
      { type: 'rond', couleur: 'corail', taille: 56, position: { top: 120, left: 14 } },
      { type: 'rond', couleur: 'lime', taille: 32, position: { top: 450, right: 26 } },
      { type: 'pilule', couleur: 'aubergine', taille: 44, position: { top: 470, left: 44 } },
    ],
  },
  {
    titre: 'Reste au courant',
    texte: 'Niveau des réserves par groupe sanguin, appels au don et collectes près de chez toi.',
    Illustration: IllustrationInfos,
    formes: [
      { type: 'ellipse', couleur: 'rose', taille: 380, position: { top: 110, left: 6 } },
      { type: 'rond', couleur: 'corailFonce', taille: 52, position: { top: 100, left: 4 } },
      { type: 'rond', couleur: 'lime', taille: 40, position: { top: 470, right: 24 } },
    ],
  },
];

const DERNIER = ECRANS.length - 1;

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const { titre, texte, Illustration, formes } = ECRANS[index];

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
      if (__DEV__) console.warn('[onboarding] mémorisation impossible :', error);
    }
    router.replace(destination);
  };

  return (
    <FondDecoratif formes={formes} anime>
      <View style={styles.page}>
        <IndicateurEtapes
          etape={index + 1}
          total={ECRANS.length}
          onRetour={index > 0 ? () => setIndex(index - 1) : undefined}
          libelleRetour="Écran précédent"
          action={
            index < DERNIER
              ? {
                  libelle: 'Passer',
                  onPress: () => setIndex(DERNIER),
                  indice: "Aller directement à l'inscription ou à la connexion",
                }
              : undefined
          }
        />

        <Illustration />

        {/* 📖 accessibilityLiveRegion : quand l'écran change, TalkBack (Android) et les
            lecteurs d'écran web annoncent le nouveau titre. VoiceOver (iOS) ne gère pas
            cette propriété. */}
        <View style={styles.textes} accessibilityLiveRegion="polite">
          <Text style={[Typo.titre1, styles.titre]} accessibilityRole="header">
            {titre}
          </Text>
          <Text style={[Typo.corps, styles.texte]}>{texte}</Text>
        </View>

        <View style={styles.pied}>
          {index < DERNIER ? (
            <Pressable
              onPress={() => setIndex(index + 1)}
              style={({ pressed }) => [styles.suivant, pressed && styles.suivantPresse]}
              accessibilityRole="button"
              accessibilityLabel="Écran suivant"
            >
              <Ionicons name="chevron-forward" size={26} color={Theme.action.primaireTexte} />
            </Pressable>
          ) : (
            <>
              <Bouton libelle="S'inscrire" onPress={() => terminer('/auth/register')} style={styles.boutonLarge} />
              <Bouton
                libelle="Se connecter"
                variante="secondaire"
                onPress={() => terminer('/auth/login')}
                style={styles.boutonLarge}
              />
            </>
          )}
        </View>
      </View>
    </FondDecoratif>
  );
}

const SUIVANT = 56;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Espace[6],
    // 📖 Même marge haute que les autres écrans plein page (cf. scan.tsx).
    paddingTop: 54,
    paddingBottom: Espace[8],
    gap: Espace[4],
  },
  textes: { gap: Espace[3] },
  titre: { color: Theme.texte.principal },
  texte: { color: Theme.texte.secondaire },
  pied: { gap: Espace[3], alignItems: 'flex-end', marginTop: Espace[4] },
  suivant: {
    width: SUIVANT,
    height: SUIVANT,
    borderRadius: Rayon.lg,
    backgroundColor: Theme.action.primaire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suivantPresse: { backgroundColor: Theme.action.primairePresse },
  boutonLarge: { alignSelf: 'stretch' },
});