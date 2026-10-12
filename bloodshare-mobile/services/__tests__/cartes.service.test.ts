import api from '../api';
import { getCartes, getCartesCache } from '../cartes.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

// Réponse réelle de GET /cartes (docs/contrat_API.md § 5) : l'événement est UNE carte
// générique `evenement.carte`, nullable.
const reponseApi = (carteEvenement: object | null) => ({
  data: {
    mois_don: {
      pourcentage_complete: 8.3,
      cartes: [{ id: 10, titre: 'Octobre', mois_numero: 10, image_url: null, obtenue: true }],
    },
    evenement: { carte: carteEvenement },
    parrainage: { carte_parrain: null, carte_filleul: null },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCartes', () => {
  it('appelle GET /cartes', async () => {
    apiGet.mockResolvedValue(reponseApi(null));

    await getCartes();

    expect(apiGet).toHaveBeenCalledWith('/cartes');
  });

  it('habille l’unique carte événement en une catégorie', async () => {
    const carte = { id: 20, titre: 'Événement', image_url: null, obtenue: true, quantite: 3 };
    apiGet.mockResolvedValue(reponseApi(carte));

    const cartes = await getCartes();

    expect(cartes.evenement.categories).toEqual([{ id: 'evenement', titre: 'Événement', cartes: [carte] }]);
  });

  it('renvoie une liste de catégories vide sans carte événement', async () => {
    apiGet.mockResolvedValue(reponseApi(null));

    const cartes = await getCartes();

    expect(cartes.evenement.categories).toEqual([]);
  });

  it('conserve les cartes du mois telles quelles', async () => {
    apiGet.mockResolvedValue(reponseApi(null));

    const cartes = await getCartes();

    expect(cartes.mois_don.pourcentage_complete).toBe(8.3);
    expect(cartes.mois_don.cartes[0].titre).toBe('Octobre');
  });

  it('met les cartes en cache pour les écrans suivants', async () => {
    apiGet.mockResolvedValue(reponseApi(null));

    const cartes = await getCartes();

    expect(getCartesCache()).toBe(cartes);
  });
});
