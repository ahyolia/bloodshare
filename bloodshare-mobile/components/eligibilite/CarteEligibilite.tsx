import { StyleSheet, View } from 'react-native';
import { Bloc } from '../ui/Bloc';
import { Bouton } from '../ui/Bouton';

type Props = {
  /** Questionnaire commencé et pas terminé, sinon `null`. */
  enCours: { numero: number; total: number } | null;
  onCommencer: () => void;
  onRecommencer: () => void;
};

// 📖 Bloc vedette de la page Don (variante `signature`, une seule par écran) : retour des
//    tests utilisateurs, le questionnaire était trop discret, tout en haut de la page.
//    Un questionnaire commencé se reprend au lieu de repartir de zéro.
export function CarteEligibilite({ enCours, onCommencer, onRecommencer }: Props) {
  return (
    <Bloc
      variante="signature"
      titre="Suis-je éligible ?"
      texte={
        enCours
          ? `Ton questionnaire est en cours : reprends à la question ${enCours.numero} sur ${enCours.total}.`
          : '15 questions, 2 minutes. Tes réponses ne sont ni enregistrées ni envoyées.'
      }
    >
      <View style={styles.boutons}>
        <Bouton
          libelle={enCours ? 'Reprendre le questionnaire' : 'Faire le test'}
          icone={enCours ? 'play-outline' : 'help-circle-outline'}
          onPress={onCommencer}
        />
        {enCours && <Bouton libelle="Recommencer" variante="discret" onPress={onRecommencer} />}
      </View>
    </Bloc>
  );
}

const styles = StyleSheet.create({
  boutons: {
    gap: 4,
    marginTop: 4,
  },
});
