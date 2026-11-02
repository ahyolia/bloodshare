import api from '../api';
import { getQuizCategories, getQuizDetail, submitQuiz, verifierQuestion } from '../quiz.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

const apiGet = api.get as jest.Mock;
const apiPost = api.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getQuizCategories', () => {
  it('appelle GET /quiz et renvoie les catégories', async () => {
    const categories = [{ categorie: 'Bases', quiz: [{ id: 1, titre: 'Quiz 1' }] }];
    apiGet.mockResolvedValue({ data: categories });

    await expect(getQuizCategories()).resolves.toEqual(categories);
    expect(apiGet).toHaveBeenCalledWith('/quiz');
  });
});

describe('getQuizDetail', () => {
  it('appelle GET /quiz/:id', async () => {
    apiGet.mockResolvedValue({ data: { id: 7, titre: 'Quiz', questions: [] } });

    const detail = await getQuizDetail(7);

    expect(apiGet).toHaveBeenCalledWith('/quiz/7');
    expect(detail.id).toBe(7);
  });

  it('propage un 404 (quiz désactivé entre-temps)', async () => {
    const erreur = { response: { status: 404 } };
    apiGet.mockRejectedValue(erreur);

    await expect(getQuizDetail(99)).rejects.toBe(erreur);
  });
});

describe('verifierQuestion', () => {
  it('envoie la réponse à POST /quiz/:id/questions/:questionId/verifier et renvoie la correction', async () => {
    const correction = {
      question_id: 5,
      reponse_ids: [2],
      correcte: false,
      reponses_correctes: [3],
      explication: 'Parce que.',
      contenu: { id: 8, titre: 'Le paludisme' },
    };
    apiPost.mockResolvedValue({ data: correction });

    await expect(verifierQuestion(3, 5, [2])).resolves.toEqual(correction);
    expect(apiPost).toHaveBeenCalledWith('/quiz/3/questions/5/verifier', { reponse_ids: [2] });
  });

  it("propage l'erreur réseau (l'écran affiche un message)", async () => {
    const erreur = new Error('Network Error');
    apiPost.mockRejectedValue(erreur);

    await expect(verifierQuestion(3, 5, [2])).rejects.toBe(erreur);
  });
});

describe('submitQuiz', () => {
  it('envoie les réponses à POST /quiz/:id/soumettre et renvoie le résultat', async () => {
    const resultat = { score: 3, total_questions: 4, points_gagnes: 30, premiere_completion: true };
    apiPost.mockResolvedValue({ data: resultat });
    const reponses = [{ question_id: 1, reponse_ids: [2] }];

    await expect(submitQuiz(3, reponses)).resolves.toEqual(resultat);
    expect(apiPost).toHaveBeenCalledWith('/quiz/3/soumettre', { reponses });
  });
});
