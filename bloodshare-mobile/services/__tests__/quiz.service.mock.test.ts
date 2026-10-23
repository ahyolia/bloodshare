import { getQuizDetail, saveProgression, submitQuiz } from '../quiz.service';

// 📖 Mode maquette (USE_MOCK_DATA) : sans backend, le service corrige lui-même les
//    réponses à partir des `correctes` du mock. On vérifie que cette correction locale
//    est juste, car c'est elle qu'on montre en démo quand l'API n'est pas joignable.
jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: true }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

// Quiz 1 du mock : Q1 → [2], Q2 → [5], Q3 (multiple) → plusieurs bonnes réponses.
const toutesLesBonnesReponses = async (id: number) => {
  const detail = await getQuizDetail(id);
  return detail.questions.map((q) => ({ question_id: q.id, reponse_ids: q.correctes ?? [] }));
};

describe('getQuizDetail (maquette)', () => {
  it('renvoie le quiz du mock', async () => {
    const detail = await getQuizDetail(1);

    expect(detail.titre).toBe('Qui peut donner son sang ?');
  });

  it('lève une erreur pour un quiz inconnu', async () => {
    await expect(getQuizDetail(9999)).rejects.toThrow('Quiz introuvable');
  });
});

describe('submitQuiz (maquette)', () => {
  it('compte un sans-faute quand toutes les réponses sont justes', async () => {
    const reponses = await toutesLesBonnesReponses(1);

    const resultat = await submitQuiz(1, reponses);

    expect(resultat.score).toBe(resultat.total_questions);
    expect(resultat.details?.every((d) => d.correcte)).toBe(true);
  });

  it('compte faux une question à choix unique avec la mauvaise réponse', async () => {
    const reponses = await toutesLesBonnesReponses(1);
    reponses[0] = { question_id: 1, reponse_ids: [1] };

    const resultat = await submitQuiz(1, reponses);

    expect(resultat.score).toBe(resultat.total_questions - 1);
    expect(resultat.details?.find((d) => d.question_id === 1)?.correcte).toBe(false);
  });

  it('compte faux une question multiple à laquelle il manque une bonne réponse', async () => {
    const reponses = await toutesLesBonnesReponses(1);
    const multiple = reponses.find((r) => r.reponse_ids.length > 1)!;
    multiple.reponse_ids = multiple.reponse_ids.slice(1);

    const resultat = await submitQuiz(1, reponses);

    expect(resultat.details?.find((d) => d.question_id === multiple.question_id)?.correcte).toBe(false);
  });

  it("accepte les bonnes réponses d'une question multiple dans n'importe quel ordre", async () => {
    const reponses = await toutesLesBonnesReponses(1);
    const multiple = reponses.find((r) => r.reponse_ids.length > 1)!;
    multiple.reponse_ids = [...multiple.reponse_ids].reverse();

    const resultat = await submitQuiz(1, reponses);

    expect(resultat.details?.find((d) => d.question_id === multiple.question_id)?.correcte).toBe(true);
  });

  it('compte faux une question sans réponse', async () => {
    const resultat = await submitQuiz(1, []);

    expect(resultat.score).toBe(0);
  });

  it('ne redonne pas de points pour un quiz déjà complété dans le mock', async () => {
    // Le quiz 1 est marqué `complete: true` dans data/mocks/quiz.json.
    const resultat = await submitQuiz(1, await toutesLesBonnesReponses(1));

    expect(resultat.points_gagnes).toBe(0);
    expect(resultat.premiere_completion).toBe(false);
  });
});

describe('saveProgression (maquette)', () => {
  it('ne fait rien sans backend', async () => {
    await expect(saveProgression(1, [])).resolves.toBeUndefined();
  });
});
