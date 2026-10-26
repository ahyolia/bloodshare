import api from '../api';
import { getCartes, getCartesCache } from '../cartes.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

// Réponse réelle de GET /cartes (docs/contrat_API.md § 5) : l'événement est une liste
// plate `evenement.cartes`, éventuellement vide.
const reponseApi = (cartesEvenement: object[] = []) => ({
  data: {
    mois_don: {
      pourcentage_complete: 8.3,
      cartes: [{ id: 10, titre: 'Octobre', mois_numero: 10, image_url: null, obtenue: true }],
    },
    evenement: { cartes: cartesEvenement },
    parrainage: { carte_parrain: null, carte_filleul: null },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCartes', () => {
  it('appelle GET /cartes', async () => {
    apiGet.mockResolvedValue(reponseApi());

    await getCartes();

    expect(apiGet).toHaveBeenCalledWith('/cartes');
  });

  it('regroupe les cartes événement en une catégorie, dans leur ordre', async () => {
    const generique = { id: 20, titre: 'Carte Événement', image_url: null, obtenue: true, quantite: 3 };
    const forum = { id: 21, titre: 'Carte Forum IUT', image_url: null, obtenue: false, quantite: 0 };
    apiGet.mockResolvedValue(reponseApi([generique, forum]));

    const cartes = await getCartes();

    expect(cartes.evenement.categories).toEqual([
      { id: 'evenement', titre: 'Événements', cartes: [generique, forum] },
    ]);
  });

  it('renvoie une liste de catégories vide sans carte événement', async () => {
    apiGet.mockResolvedValue(reponseApi());

    const cartes = await getCartes();

    expect(cartes.evenement.categories).toEqual([]);
  });

  it('conserve les cartes du mois telles quelles', async () => {
    apiGet.mockResolvedValue(reponseApi());

    const cartes = await getCartes();

    expect(cartes.mois_don.pourcentage_complete).toBe(8.3);
    expect(cartes.mois_don.cartes[0].titre).toBe('Octobre');
  });

  it('met les cartes en cache pour les écrans suivants', async () => {
    apiGet.mockResolvedValue(reponseApi());

    const cartes = await getCartes();

    expect(getCartesCache()).toBe(cartes);
  });
});
