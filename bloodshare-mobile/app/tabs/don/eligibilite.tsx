import { useFocusEffect } from 'expo-router';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { QuestionView } from '../../../components/eligibilite/QuestionView';
import { ResultatView } from '../../../components/eligibilite/ResultatView';
import { TAB_BAR_STYLE } from '../_layout';
import { useEligibilite } from '../../../hooks/useEligibilite';

export default function EligibiliteScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  // 📖 Unique appel du hook : c'est la "single source of truth" du questionnaire
  // → QuestionView et ResultatView ne font que lire ces valeurs et appeler ces fonctions, ils ne possèdent aucun état métier à eux
  const {
    questionActuelle,
    historique,
    resultat,
    repondre,
    revenirArriere,
    recommencer,
    progression,
    peutRevenirArriere,
  } = useEligibilite();

  return (
    <View style={{ flex: 1 }}>
      {resultat ? (
        <ResultatView resultat={resultat} onRecommencer={recommencer} />
      ) : (
        <QuestionView
          question={questionActuelle}
          numeroQuestion={historique.length + 1}
          progression={progression}
          peutRevenirArriere={peutRevenirArriere}
          onRepondre={repondre}
          onRetour={revenirArriere}
          onQuitter={() => router.back()}
        />
      )}
    </View>
  );
}
