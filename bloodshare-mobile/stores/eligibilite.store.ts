import type { Reponse } from '../constants/eligibilite';
import { TOTAL_QUESTIONS } from '../constants/eligibilite';

// 📖 Questionnaire d'éligibilité en cours, gardé EN MÉMOIRE seulement : on peut quitter
//    l'écran (lire une fiche, changer d'onglet) et reprendre à la même question.
//    Rien n'est écrit sur le téléphone ni envoyé au serveur : ce sont des données de
//    santé, et la carte promet « Sans données conservées ». Fermer l'app efface tout.
let reponsesEnCours: Reponse[] = [];

export const lireQuestionnaire = (): Reponse[] => reponsesEnCours;

export const enregistrerQuestionnaire = (reponses: Reponse[]) => {
  reponsesEnCours = reponses;
};

export const effacerQuestionnaire = () => {
  reponsesEnCours = [];
};

/** Numéro de la prochaine question si un questionnaire est commencé, sinon `null`. */
export const questionnaireEnCours = (): { numero: number; total: number } | null =>
  reponsesEnCours.length > 0 ? { numero: reponsesEnCours.length + 1, total: TOTAL_QUESTIONS } : null;
