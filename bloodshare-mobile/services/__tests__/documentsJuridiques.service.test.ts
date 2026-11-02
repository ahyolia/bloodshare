import api from '../api';
import { getDocumentJuridique } from '../documentsJuridiques.service';

// 📖 Route publique : lue sans token, y compris depuis l'écran d'inscription.
jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getDocumentJuridique', () => {
  it('appelle GET /documents-juridiques/{type} et renvoie le document', async () => {
    const document = {
      type: 'cgu',
      titre: "Conditions générales d'utilisation",
      contenu: '## Objet',
      version: '1.0',
      mis_a_jour_le: '2026-10-14',
    };
    apiGet.mockResolvedValue({ data: document });

    await expect(getDocumentJuridique('cgu')).resolves.toEqual(document);
    expect(apiGet).toHaveBeenCalledWith('/documents-juridiques/cgu');
  });

  it("renvoie null quand le document n'est pas encore rédigé (404)", async () => {
    apiGet.mockRejectedValue({ isAxiosError: true, response: { status: 404 } });

    await expect(getDocumentJuridique('mentions_legales')).resolves.toBeNull();
  });

  it('propage les autres erreurs', async () => {
    const erreurReseau = { isAxiosError: true, request: {} };
    apiGet.mockRejectedValue(erreurReseau);

    await expect(getDocumentJuridique('cgu')).rejects.toBe(erreurReseau);
  });
});
