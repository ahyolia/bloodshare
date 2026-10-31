import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Question, Reponse, TOTAL_QUESTIONS } from '../../constants/eligibilite';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { Bouton } from '../ui/Bouton';

type Props = {
  question: Question;
  numeroQuestion: number;
  peutRevenirArriere: boolean;
  onRepondre: (reponse: Reponse) => void;
  onRetour: () => void;
  onQuitter: () => void;
};

const BOUTON_ROND = 44;

// Bouton rond et blanc des en-têtes du design system (comme EnTeteSousPage).
function BoutonRond({
  icone,
  libelle,
  onPress,
}: {
  icone: ComponentProps<typeof Ionicons>['name'];
  libelle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={2}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      style={({ pressed }) => [styles.boutonRond, pressed && styles.presse]}
    >
      <Ionicons name={icone} size={22} color={Theme.texte.principal} />
    </Pressable>
  );
}

// 📖 Un écran par question : la question en grand et ses réponses, centrées ensemble.
//    En haut : « question précédente » à gauche, l'avancement en points, et la croix pour
//    quitter à droite (les réponses restent en mémoire, on pourra reprendre).
export function QuestionView({
  question,
  numeroQuestion,
  peutRevenirArriere,
  onRepondre,
  onRetour,
  onQuitter,
}: Props) {
  // Sens du glissement : on compare au numéro affiché juste avant (état ajusté pendant le
  // rendu quand la question change, le schéma recommandé par React plutôt qu'un effet).
  const [precedent, setPrecedent] = useState(numeroQuestion);
  const [recule, setRecule] = useState(false);
  if (numeroQuestion !== precedent) {
    setRecule(numeroQuestion < precedent);
    setPrecedent(numeroQuestion);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {/* Place réservée même sans bouton : les points restent centrés. */}
        <View style={styles.case}>
          {peutRevenirArriere && (
            <Animated.View entering={FadeIn.duration(200)}>
              <BoutonRond icone="chevron-back" libelle="Question précédente" onPress={onRetour} />
            </Animated.View>
          )}
        </View>

        <View style={styles.points} accessibilityLabel={`Question ${numeroQuestion} sur ${TOTAL_QUESTIONS}`}>
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.point,
                index < numeroQuestion - 1 && styles.pointFait,
                index === numeroQuestion - 1 && styles.pointActif,
              ]}
            />
          ))}
        </View>

        <BoutonRond icone="close" libelle="Quitter le questionnaire" onPress={onQuitter} />
      </View>

      {/* 📖 La question et ses réponses forment un seul groupe, centré dans l'écran. Une
          clé par question : le groupe entre en glissant depuis la droite (suivante) ou la
          gauche (précédente). Ignoré si « Réduire les animations » est activé. */}
      <View style={styles.centre}>
        <Animated.View
          key={numeroQuestion}
          entering={(recule ? FadeInLeft : FadeInRight).duration(280)}
          style={styles.groupe}
        >
          <View style={styles.question}>
            <Text style={[Typo.legendeForte, styles.numero]}>
              Question {numeroQuestion} sur {TOTAL_QUESTIONS}
            </Text>
            <Text style={[Typo.titre2, styles.texte]} accessibilityRole="header">
              {question.texte}
            </Text>
            {question.sous_texte && <Text style={[Typo.corps, styles.sousTexte]}>{question.sous_texte}</Text>}
          </View>

          {/* 📖 Oui et Non : deux tuiles blanches identiques (surélevées : elles se
              touchent), aucune ne doit sembler « la bonne ». « Je ne sais pas » renvoie
              vers le Don du Sang plutôt que de deviner. */}
          <View style={styles.tuiles}>
            {(['oui', 'non'] as const).map((valeur) => (
              <Pressable
                key={valeur}
                onPress={() => onRepondre(valeur)}
                accessibilityRole="button"
                accessibilityLabel={valeur === 'oui' ? 'Oui' : 'Non'}
                style={({ pressed }) => [styles.tuile, pressed && styles.tuilePressee]}
              >
                <Text style={[Typo.titre3, styles.tuileTexte]}>{valeur === 'oui' ? 'Oui' : 'Non'}</Text>
              </Pressable>
            ))}
          </View>
          <Bouton libelle="Je ne sais pas" variante="discret" onPress={() => onRepondre('ne_sait_pas')} />
        </Animated.View>
      </View>

      <View style={styles.anonymat}>
        <Ionicons name="lock-closed-outline" size={14} color={Theme.texte.secondaire} />
        <Text style={[Typo.legende, styles.anonymatTexte]}>Tes réponses ne sont ni enregistrées ni envoyées.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
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
  case: {
    width: BOUTON_ROND,
  },
  points: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  point: {
    width: 6,
    height: 6,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.bordure,
  },
  // Questions passées en aubergine pâle, la question en cours en aubergine, plus grande.
  pointFait: {
    backgroundColor: Theme.texte.desactive,
  },
  pointActif: {
    width: 9,
    height: 9,
    backgroundColor: Theme.action.primaire,
  },
  centre: {
    flex: 1,
    justifyContent: 'center',
  },
  groupe: {
    gap: Espace[6],
  },
  question: {
    gap: Espace[2],
  },
  numero: {
    color: Theme.texte.secondaire,
  },
  texte: {
    color: Theme.texte.principal,
  },
  sousTexte: {
    color: Theme.texte.secondaire,
  },
  tuiles: {
    flexDirection: 'row',
    gap: Espace[3],
  },
  tuile: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  // La tuile s'enfonce légèrement sous le doigt : on sent qu'on l'a touchée.
  tuilePressee: {
    transform: [{ scale: 0.97 }],
  },
  tuileTexte: {
    color: Theme.texte.principal,
  },
  anonymat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espace[1],
  },
  anonymatTexte: {
    color: Theme.texte.secondaire,
  },
});
