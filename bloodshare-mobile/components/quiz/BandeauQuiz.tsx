import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Theme } from '../../constants/colors';
import { Palette } from '../../constants/palette';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import type { QuizItem } from '../../services/quiz.service';
import { accorder } from '../../utils/pluriel';
import { DecorBandeau } from './DecorBandeau';

type Props = {
  /** Quiz commencés, avec leur catégorie : affichés en carrousel s'il y en a. */
  enCours: { quiz: QuizItem; categorie: string }[];
  /** Quiz proposé quand rien n'est en cours, ou `null` si tout est terminé. */
  aCommencer: QuizItem | null;
  onOuvrir: (quiz: QuizItem) => void;
};

// 📖 Bandeau aubergine en haut de l'onglet Quiz :
//    - des quiz commencés → un carrousel, une carte par quiz à reprendre ;
//    - sinon → « Teste tes connaissances », avec un quiz à commencer ou des félicitations.
//    Texte crème sur aubergine : contraste 13:1.
export function BandeauQuiz({ enCours, aCommencer, onOuvrir }: Props) {
  if (enCours.length > 0) return <CarrouselReprise enCours={enCours} onOuvrir={onOuvrir} />;

  return (
    <View style={styles.bandeau}>
      <DecorBandeau />
      <Text style={[Typo.titre2, styles.texteClair]} accessibilityRole="header">
        Teste tes connaissances
      </Text>
      <Text style={[Typo.corps, styles.texteClair, styles.texteLimite]}>
        {aCommencer
          ? 'Apprends tout sur le don du sang et gagne des points.'
          : 'Tu as terminé tous les quiz, bravo ! Rejoue-les quand tu veux.'}
      </Text>
      {aCommencer && <BoutonBandeau libelle="Commencer un quiz" onPress={() => onOuvrir(aCommencer)} />}
    </View>
  );
}

function CarrouselReprise({ enCours, onOuvrir }: Pick<Props, 'enCours' | 'onOuvrir'>) {
  const [largeur, setLargeur] = useState(0);
  const [page, setPage] = useState(0);

  return (
    <View testID="carrousel-quiz" onLayout={(e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width)}>
      {/* 📖 Une carte par page : pagingEnabled aligne chaque carte sur la largeur du bandeau,
          connue après la première mise en page. */}
      {largeur > 0 && (
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / largeur))}
        scrollEventThrottle={16}
        contentContainerStyle={styles.carrouselContenu}
      >
        {enCours.map(({ quiz, categorie }, index) => (
          <View
            key={quiz.id}
            style={[styles.bandeau, styles.carte, { width: largeur }]}
            accessibilityLabel={
              enCours.length > 1 ? `Quiz en cours ${index + 1} sur ${enCours.length}` : 'Quiz en cours'
            }
          >
            <DecorBandeau />
            <Text style={[Typo.legendeForte, styles.texteClair]}>{categorie}</Text>
            <Text style={[Typo.titre3, styles.texteClair]} numberOfLines={1}>
              {quiz.titre}
            </Text>

            <View style={styles.progression}>
              <View style={styles.piste}>
                <View
                  style={[
                    styles.remplissage,
                    { width: `${(quiz.questions_repondues / Math.max(quiz.nb_questions, 1)) * 100}%` },
                  ]}
                />
              </View>
              <Text style={[Typo.legende, styles.texteClair]}>
                {quiz.questions_repondues}/{quiz.nb_questions} {accorder(quiz.nb_questions, 'question')}
              </Text>
            </View>

            <BoutonBandeau
              libelle="Reprendre"
              accessibilityLabel={`Reprendre ${quiz.titre}`}
              onPress={() => onOuvrir(quiz)}
            />
          </View>
        ))}
      </ScrollView>
      )}

      {enCours.length > 1 && (
        <View style={styles.points} accessible={false}>
          {enCours.map(({ quiz }, index) => (
            <View key={quiz.id} style={[styles.point, index === page && styles.pointActif]} />
          ))}
        </View>
      )}
    </View>
  );
}

function BoutonBandeau({
  libelle,
  accessibilityLabel,
  onPress,
}: {
  libelle: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? libelle}
      style={({ pressed }) => [styles.bouton, pressed && styles.presse]}
    >
      <Text style={[Typo.bouton, styles.boutonTexte]}>{libelle}</Text>
      <Ionicons name="chevron-forward" size={18} color={Theme.texte.principal} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    backgroundColor: Theme.action.primaire,
    borderRadius: Rayon.lg,
    padding: Espace[6],
    gap: Espace[2],
    overflow: 'hidden',
  },
  // 📖 Toutes les cartes du carrousel ont la même taille : la largeur du bandeau, et la
  //    même hauteur (titre plus petit, sur une seule ligne, et cartes étirées à la plus
  //    haute). Sinon la page « saute » d'une carte à l'autre.
  carrouselContenu: { alignItems: 'stretch' },
  carte: { justifyContent: 'space-between' },
  texteClair: { color: Theme.texte.surAccent },
  texteLimite: { maxWidth: '85%' },
  progression: {
    gap: Espace[1],
    maxWidth: '85%',
  },
  piste: {
    height: 6,
    borderRadius: Rayon.plein,
    backgroundColor: 'rgba(255, 253, 247, 0.25)',
    overflow: 'hidden',
  },
  remplissage: {
    height: 6,
    borderRadius: Rayon.plein,
    backgroundColor: Palette.lime[500],
  },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espace[1],
    marginTop: Espace[2],
    paddingVertical: Espace[2],
    paddingHorizontal: Espace[4],
    borderRadius: Rayon.plein,
    backgroundColor: Theme.texte.surAccent,
  },
  boutonTexte: { color: Theme.texte.principal },
  presse: { opacity: 0.85 },
  points: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Espace[1],
    marginTop: Espace[3],
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: Rayon.plein,
    backgroundColor: Theme.fond.bordure,
  },
  pointActif: {
    width: 20,
    backgroundColor: Theme.action.primaire,
  },
});
