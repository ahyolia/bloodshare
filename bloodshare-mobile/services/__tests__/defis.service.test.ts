import api from '../api';
import { getDefiActuel } from '../defis.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getDefiActuel', () => {
  it('appelle GET /defis/actuel et renvoie le défi', async () => {
    const defi = { titre: 'Octobre rouge', progression_actuelle: 12, objectif_chiffre: 50 };
    apiGet.mockResolvedValue({ data: defi });

    await expect(getDefiActuel()).resolves.toEqual(defi);
    expect(apiGet).toHaveBeenCalledWith('/defis/actuel');
  });

  // 📖 Sans défi, l'API renvoie le JSON `null` ; un 204 donnerait une chaîne vide.
  it.each([
    ['null', null],
    ['un corps vide', ''],
  ])("renvoie null quand l'API répond %s", async (_description, corps) => {
    apiGet.mockResolvedValue({ data: corps });

    await expect(getDefiActuel()).resolves.toBeNull();
  });
});
