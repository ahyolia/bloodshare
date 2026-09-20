import api from '../api';
import { getBadgesResume } from '../badges.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

// Réponse réelle de GET /badges (docs/contrat_API.md § 6) : la liste de tous les badges.
const badge = (id: number, obtenu: boolean) => ({ id, nom: `Badge ${id}`, obtenu });

describe('getBadgesResume', () => {
  it('appelle GET /badges', async () => {
    apiGet.mockResolvedValue({ data: [] });

    await getBadgesResume();

    expect(apiGet).toHaveBeenCalledWith('/badges');
  });

  it('calcule le nombre de badges obtenus et le total à partir de la liste', async () => {
    apiGet.mockResolvedValue({ data: [badge(1, true), badge(2, false), badge(3, true)] });

    expect(await getBadgesResume()).toEqual({ obtenus: 2, total: 3 });
  });

  it('renvoie 0/0 quand il n’existe aucun badge', async () => {
    apiGet.mockResolvedValue({ data: [] });

    expect(await getBadgesResume()).toEqual({ obtenus: 0, total: 0 });
  });
});
