import api from '../api';
import { soumettreScan } from '../scan.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const apiPost = api.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('soumettreScan', () => {
  it('envoie le contenu du QR Code à POST /scan', async () => {
    apiPost.mockResolvedValue({ data: { type: 'don', carte_obtenue: null, badges_debloques: [] } });

    await soumettreScan('token-du-centre');

    expect(apiPost).toHaveBeenCalledWith('/scan', { token: 'token-du-centre' });
  });

  it('renvoie la carte et les badges obtenus tels que renvoyés par l’API', async () => {
    const resultat = {
      type: 'don',
      carte_obtenue: { id: 10, titre: 'Octobre', categorie: 'mois_don', deja_possedee: false },
      badges_debloques: [{ id: 1, nom: 'Premier don' }],
    };
    apiPost.mockResolvedValue({ data: resultat });

    await expect(soumettreScan('token')).resolves.toEqual(resultat);
  });

  // 📖 L'écran de scan lit `response.status` et `response.data.message` pour afficher
  //    « pas encore éligible », « QR Code invalide »... : le service ne doit pas avaler l'erreur.
  it.each([
    [404, 'QR Code invalide ou expiré.'],
    [422, 'Tu n’es pas encore éligible pour donner.'],
    [503, 'La carte du mois n’est pas encore disponible.'],
  ])('propage une réponse %i pour que l’écran affiche le bon message', async (status, message) => {
    const erreur = { response: { status, data: { message } } };
    apiPost.mockRejectedValue(erreur);

    await expect(soumettreScan('token')).rejects.toBe(erreur);
  });

  it('propage une erreur réseau', async () => {
    apiPost.mockRejectedValue(new Error('Network Error'));

    await expect(soumettreScan('token')).rejects.toThrow('Network Error');
  });
});
