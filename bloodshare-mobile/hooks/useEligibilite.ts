import { useState } from 'react';
import { getQuestion, Question, ResultatEligibilite } from '../constants/eligibilite';

const TOTAL_QUESTIONS = 15;

export function useEligibilite() {
  // 📖 On démarre toujours à la question 1 : c'est la racine de l'arbre de décision
  const [questionActuelle, setQuestionActuelle] = useState<Question>(getQuestion(1));

  // 📖 historique mémorise les ids des questions déjà répondues, dans l'ordre de passage
  // → Pourquoi : sans lui, impossible de savoir "d'où on vient" pour permettre un retour arrière fiable
  const [historique, setHistorique] = useState<number[]>([]);

  const [resultat, setResultat] = useState<ResultatEligibilite | null>(null);

  // 📖 repondre() lit la branche correspondante (oui/non) de la question actuelle
  // → Si c'est { suivant } : on avance dans l'arbre — l'id de la question qu'on quitte part dans l'historique
  // → Si c'est un ResultatEligibilite : on est arrivé à une feuille, on fige le résultat
  const repondre = (reponse: 'oui' | 'non') => {
    const branche = reponse === 'oui' ? questionActuelle.reponse_oui : questionActuelle.reponse_non;

    if ('suivant' in branche) {
      setHistorique((prev) => [...prev, questionActuelle.id]);
      setQuestionActuelle(getQuestion(branche.suivant));
    } else {
      setResultat(branche);
    }
  };

  // 📖 revenirArriere() dépile le dernier id visité et réaffiche cette question
  // → Si on était sur l'écran résultat (resultat !== null), on l'efface pour retomber sur la dernière question posée
  const revenirArriere = () => {
    if (historique.length === 0) return;

    const dernierId = historique[historique.length - 1];
    setHistorique((prev) => prev.slice(0, -1));
    setQuestionActuelle(getQuestion(dernierId));
    setResultat(null);
  };

  // 📖 recommencer() remet le hook exactement dans son état initial
  const recommencer = () => {
    setQuestionActuelle(getQuestion(1));
    setHistorique([]);
    setResultat(null);
  };

  // 📖 progression en % : nombre de questions déjà répondues / total
  const progression = (historique.length / TOTAL_QUESTIONS) * 100;

  const peutRevenirArriere = historique.length > 0;

  return {
    questionActuelle,
    historique,
    resultat,
    repondre,
    revenirArriere,
    recommencer,
    progression,
    peutRevenirArriere,
  };
}
