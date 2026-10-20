import api from '../api';
import { getPointsHistorique } from '../points.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

// Réponse réelle de GET /points/historique (docs/contrat_API.md § 7) : un objet, sans `id`.
const reponseApi = {
  data: {
    points_cumules: 110,
    historique: [
      { points: 30, source: 'quiz', created_at: '2026-09-20T22:52:54Z' },
      { points: 50, source: 'defi', created_at: '2026-09-20T22:23:17Z' },
    ],
  },
};

describe('getPointsHistorique', () => {
  it('appelle GET /points/historique', async () => {
    apiGet.mockResolvedValue(reponseApi);

    await getPointsHistorique();

    expect(apiGet).toHaveBeenCalledWith('/points/historique');
  });

  it('renvoie un tableau de gains avec un id unique et la date renommée', async () => {
    apiGet.mockResolvedValue(reponseApi);

    const gains = await getPointsHistorique();

    expect(gains).toEqual([
      { id: 0, source: 'quiz', points: 30, date: '2026-09-20T22:52:54Z' },
    ]);
  });

  // 📖 Un défi ne rapporte plus de points : une ancienne ligne « defi » renvoyée par un
  //    serveur pas encore migré ne doit pas atteindre l'écran (ni le faire planter).
  it('écarte les sources de points inconnues de l’app, comme un ancien « defi »', async () => {
    apiGet.mockResolvedValue(reponseApi);

    const gains = await getPointsHistorique();

    expect(gains.map((g) => g.source)).toEqual(['quiz']);
  });

  it('renvoie un tableau vide quand il n’y a aucun gain', async () => {
    apiGet.mockResolvedValue({ data: { points_cumules: 0, historique: [] } });

    expect(await getPointsHistorique()).toEqual([]);
  });
});
