import api from '../api';
import { getDons } from '../dons.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

// Réponse réelle de GET /dons (docs/contrat_API.md § 4) : la liste est sous `data`.
const reponseApi = {
  data: {
    data: [
      {
        id: 3,
        date_don: '2026-09-20T22:19:42Z',
        type: 'centre',
        carte_obtenue: { id: 9, titre: 'Carte de Septembre', categorie: 'mois_don' },
      },
      { id: 4, date_don: '2026-09-25T09:00:00Z', type: 'evenement', carte_obtenue: null },
    ],
    total_dons: 2,
  },
};

describe('getDons', () => {
  it('appelle GET /dons', async () => {
    apiGet.mockResolvedValue(reponseApi);

    await getDons();

    expect(apiGet).toHaveBeenCalledWith('/dons');
  });

  it('lit la liste sous `data` et la renvoie sous `dons`', async () => {
    apiGet.mockResolvedValue(reponseApi);

    const resultat = await getDons();

    expect(resultat.total_dons).toBe(2);
    expect(resultat.dons).toHaveLength(2);
    expect(resultat.dons[0].id).toBe(3);
  });

  it('convertit le type "centre" en "don" et conserve "evenement"', async () => {
    apiGet.mockResolvedValue(reponseApi);

    const { dons } = await getDons();

    expect(dons[0].type).toBe('don');
    expect(dons[1].type).toBe('evenement');
  });

  it('renvoie une liste vide quand il n’y a aucun don', async () => {
    apiGet.mockResolvedValue({ data: { data: [], total_dons: 0 } });

    const resultat = await getDons();

    expect(resultat).toEqual({ total_dons: 0, dons: [] });
  });
});
