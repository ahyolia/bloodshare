import { USE_MOCK_DATA } from '../constants/config';
import quizMock from '../data/mocks/quiz.json';
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
