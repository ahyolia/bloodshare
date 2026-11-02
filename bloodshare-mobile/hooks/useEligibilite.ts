import { useEffect, useState } from 'react';
import {
  QUESTIONS,
  Reponse,
  resultatPour,
  ResultatEligibilite,
  TOTAL_QUESTIONS,
} from '../constants/eligibilite';
import {
  effacerQuestionnaire,
  enregistrerQuestionnaire,
  lireQuestionnaire,
} from '../stores/eligibilite.store';

export function useEligibilite() {
  // 📖 Réponses déjà données, dans l'ordre des questions. On repart de celles gardées en
  //    mémoire : quitter l'écran puis revenir reprend à la même question.
  const [reponses, setReponses] = useState<Reponse[]>(lireQuestionnaire);

  // 📖 La réponse qui décide du résultat n'est pas ajoutée à `reponses` : « retour »
  //    depuis le résultat réaffiche donc simplement la dernière question posée.
  const [resultat, setResultat] = useState<ResultatEligibilite | null>(null);

  // 📖 Un questionnaire terminé n'est plus « en cours » : la page Don proposera de le
  //    refaire. Sauf après « Je ne sais pas » : on garde les réponses données, pour
  //    reprendre à cette question une fois l'information vérifiée.
  useEffect(() => {
    if (resultat && resultat.statut !== 'a_verifier') effacerQuestionnaire();
    else enregistrerQuestionnaire(reponses);
  }, [reponses, resultat]);

  const questionActuelle = QUESTIONS[Math.min(reponses.length, TOTAL_QUESTIONS - 1)];

  const repondre = (reponse: Reponse) => {
    const decision = resultatPour(questionActuelle, reponse);

    if (decision) {
      setResultat(decision);
    } else if (reponses.length === TOTAL_QUESTIONS - 1) {
      setResultat({ statut: 'eligible' });
    } else {
      setReponses((prev) => [...prev, reponse]);
    }
  };

  const revenirArriere = () => {
    if (resultat) {
      setResultat(null);
      return;
    }
    setReponses((prev) => prev.slice(0, -1));
  };

  const recommencer = () => {
    setReponses([]);
    setResultat(null);
  };

  return {
    questionActuelle,
    numeroQuestion: reponses.length + 1,
    resultat,
    repondre,
    revenirArriere,
    recommencer,
    progression: (reponses.length / TOTAL_QUESTIONS) * 100,
    peutRevenirArriere: reponses.length > 0 || resultat !== null,
  };
}
