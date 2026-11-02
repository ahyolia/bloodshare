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
  // 📖 Présents uniquement dans le mock (le vrai backend ne renvoie jamais les bonnes réponses
  //    au client avant validation). Servent à la correction locale ci-dessous, jamais affichés tels quels.
  correctes?: number[];
  explication?: string | null;
  contenu?: FicheLiee | null;
};

// 📖 Fiche pratique à ouvrir depuis la correction d'une question.
export type FicheLiee = {
  id: number;
  titre: string;
};

export type Correction = {
  correcte: boolean;
  reponses_correctes: number[];
  explication: string | null;
  contenu: FicheLiee | null;
};

export type QuizDetail = {
  id: number;
  titre: string;
  aleatoire: boolean;
  questions: Question[];
  // 📖 Réponses déjà validées lors d'une tentative non terminée (reprise du quiz), avec leur
  //    correction : elles sont verrouillées côté serveur. Absent du mock.
  reponses_donnees?: (ReponsePayload & { correction?: Correction })[];
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

export type QuestionCorrigee = Correction & {
  question_id: number;
  // 📖 Réponses retenues par le serveur : celles déjà verrouillées si la question avait
  //    été validée avant (autre appareil, reprise), sinon celles qu'on vient d'envoyer.
  reponse_ids: number[];
};

export type DetailReponse = Correction & {
  question_id: number;
  // 📖 Réponses comptées pour le score (celles verrouillées à la validation).
  reponse_ids: number[];
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

// 📖 Correction locale d'une question du mock (mode maquette uniquement).
const corrigerMock = (question: Question, reponseIds: number[]): Correction => ({
  correcte: memesIds(reponseIds, question.correctes ?? []),
  reponses_correctes: question.correctes ?? [],
  explication: question.explication ?? null,
  contenu: question.contenu ?? null,
});

// 📖 Valide une question : le serveur la corrige et verrouille la réponse, qui ne pourra plus
//    être changée. Il enregistre aussi la progression (le quiz apparaît dans "Quiz en cours").
export const verifierQuestion = async (
  quizId: number,
  questionId: number,
  reponseIds: number[]
): Promise<QuestionCorrigee> => {
  if (USE_MOCK_DATA) {
    const detail = (quizDetailsMock as Record<string, QuizDetail>)[String(quizId)];
    const question = detail?.questions.find((q) => q.id === questionId);
    if (!question) throw new Error('Question introuvable');

    return { question_id: questionId, reponse_ids: reponseIds, ...corrigerMock(question, reponseIds) };
  }

  const response = await api.post<QuestionCorrigee>(
    `/quiz/${quizId}/questions/${questionId}/verifier`,
    { reponse_ids: reponseIds }
  );
  return response.data;
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
      reponse_ids: parQuestion.get(q.id) ?? [],
      ...corrigerMock(q, parQuestion.get(q.id) ?? []),
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
