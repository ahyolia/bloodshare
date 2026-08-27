import { USE_MOCK_DATA } from '../constants/config';
import quizMock from '../data/mocks/quiz.json';
import quizDetailsMock from '../data/mocks/quiz-details.json';
import api from './api';

export type QuizItem = {
  id: number;
  titre: string;
  points_attribues: number;
  complete: boolean;
  nb_questions: number;
  nb_tentatives: number;
  questions_repondues: number;
  score: number | null;
};

export type CategorieQuiz = {
  categorie: string;
  quiz: QuizItem[];
};

export const getQuizCategories = async (): Promise<CategorieQuiz[]> => {
  if (USE_MOCK_DATA) {
    return quizMock as CategorieQuiz[];
  }

  const response = await api.get<CategorieQuiz[]>('/quiz');
  return response.data;
};

export type Reponse = {
  id: number;
  texte: string;
};

export type Question = {
  id: number;
  intitule: string;
  type: 'unique' | 'multiple';
  ordre: number;
  reponses: Reponse[];
};

export type QuizDetail = {
  id: number;
  titre: string;
  aleatoire: boolean;
  questions: Question[];
};

export const getQuizDetail = async (id: number): Promise<QuizDetail> => {
  if (USE_MOCK_DATA) {
    const detail = (quizDetailsMock as Record<string, QuizDetail>)[String(id)];
    if (!detail) throw new Error('Quiz introuvable');
    return detail;
  }

  const response = await api.get<QuizDetail>(`/quiz/${id}`);
  return response.data;
};

export type ReponsePayload = {
  question_id: number;
  reponse_ids: number[];
};

export type SoumissionResultat = {
  score: number;
  total_questions: number;
  points_gagnes: number;
  premiere_completion: boolean;
};

export const submitQuiz = async (
  id: number,
  reponses: ReponsePayload[]
): Promise<SoumissionResultat> => {
  if (USE_MOCK_DATA) {
    // 📖 Simule une correction serveur : ici on ne peut pas vraiment calculer un score (les
    // bonnes réponses ne sont jamais exposées côté mock, comme sur le vrai backend), donc on
    // renvoie un résultat plausible pour permettre de tester l'écran score sans API réelle
    const total = reponses.length;
    const score = Math.max(1, Math.round(total * 0.8));

    // 📖 On retrouve le quiz dans le catalogue mock pour renvoyer des points cohérents
    //    (points_attribues du quiz) et savoir s'il a déjà été complété → dans ce cas
    //    aucun nouveau point n'est accordé et l'écran score affiche le message "déjà complété"
    const quizConcerne = (quizMock as CategorieQuiz[])
      .flatMap((cat) => cat.quiz)
      .find((q) => q.id === id);
    const dejaComplete = quizConcerne?.complete ?? false;

    return {
      score,
      total_questions: total,
      points_gagnes: dejaComplete ? 0 : (quizConcerne?.points_attribues ?? 10),
      premiere_completion: !dejaComplete,
    };
  }

  const response = await api.post<SoumissionResultat>(`/quiz/${id}/soumettre`, { reponses });
  return response.data;
};
