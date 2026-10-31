import type { DetailReponse, Question } from '../services/quiz.service';

export type RecapQuiz = {
  questions: Question[];
  details: DetailReponse[];
};

// 📖 Correction complète du dernier quiz soumis, gardée en mémoire pour le récapitulatif de
//    l'écran score (intitulés, réponses, explications). On ne la passe pas en paramètres de
//    navigation : sur le web ils finissent dans l'URL, bien trop longue avec les explications.
//    Perdue au rechargement de la page : l'écran score retombe alors sur les pastilles seules.
let dernierQuiz: (RecapQuiz & { quizId: number }) | null = null;

export const memoriserRecapQuiz = (quizId: number, recap: RecapQuiz) => {
  dernierQuiz = { quizId, ...recap };
};

export const recapDuQuiz = (quizId: number): RecapQuiz | null =>
  dernierQuiz?.quizId === quizId ? dernierQuiz : null;
