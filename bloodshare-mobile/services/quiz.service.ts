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
  // 📖 Présent uniquement dans le mock (le vrai backend ne renvoie jamais les bonnes réponses
  //    au client). Sert à la correction locale dans submitQuiz ci-dessous, jamais affiché.
  correctes?: number[];
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

export type DetailReponse = {
  question_id: number;
  correcte: boolean;
};

export type SoumissionResultat = {
  score: number;
  total_questions: number;
  points_gagnes: number;
  premiere_completion: boolean;
  // 📖 Correction question par question. Optionnel : le vrai backend peut ne renvoyer
  //    que le score global — l'écran score sait retomber sur un affichage approché.
  details?: DetailReponse[];
};

// 📖 Deux ensembles d'ids sont "égaux" s'ils contiennent exactement les mêmes valeurs,
//    sans tenir compte de l'ordre (une question multiple n'est juste que si TOUTES les
//    bonnes réponses sont cochées et aucune mauvaise).
const memesIds = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const trie = (xs: number[]) => [...xs].sort((x, y) => x - y);
  const [as, bs] = [trie(a), trie(b)];
  return as.every((v, i) => v === bs[i]);
};

export const submitQuiz = async (
  id: number,
  reponses: ReponsePayload[]
): Promise<SoumissionResultat> => {
  if (USE_MOCK_DATA) {
    // 📖 Correction locale : on compare les réponses de l'utilisateur aux `correctes`
    //    du mock, question par question, pour un score et un détail réellement fidèles.
    const detail = (quizDetailsMock as Record<string, QuizDetail>)[String(id)];
    const parQuestion = new Map(reponses.map((r) => [r.question_id, r.reponse_ids]));

    const details: DetailReponse[] = (detail?.questions ?? []).map((q) => ({
      question_id: q.id,
      correcte: memesIds(parQuestion.get(q.id) ?? [], q.correctes ?? []),
    }));

    const total = detail?.questions.length ?? reponses.length;
    const score = details.filter((d) => d.correcte).length;

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
      details,
    };
  }

  const response = await api.post<SoumissionResultat>(`/quiz/${id}/soumettre`, { reponses });
  return response.data;
};
