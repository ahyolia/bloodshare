import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import api from '../api';
import { getToken, removeToken } from '../../stores/auth.store';

jest.mock('../../constants/api', () => ({ API_URL: 'https://api.example.test' }));

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const mockReplace = router.replace as jest.Mock;

jest.mock('../../stores/auth.store', () => ({
  getToken: jest.fn(),
  removeToken: jest.fn(),
}));

const mockGetToken = getToken as jest.Mock;
const mockRemoveToken = removeToken as jest.Mock;

// 📖 On remplace l'adaptateur réseau d'axios : les intercepteurs de api.ts tournent
//    pour de vrai, mais aucune requête ne quitte le test.
const adaptateur = jest.fn();
api.defaults.adapter = adaptateur;

const repondre = (status: number) => (config: InternalAxiosRequestConfig) => {
  const reponse = { data: {}, status, statusText: '', headers: {}, config };
  if (status >= 400) {
    return Promise.reject(new AxiosError('Erreur', String(status), config, null, reponse));
  }
  return Promise.resolve(reponse);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('client api', () => {
  it('ajoute le token en en-tête Authorization quand il existe', async () => {
    mockGetToken.mockResolvedValue('mon-token');
    adaptateur.mockImplementation(repondre(200));

    await api.get('/me');

    const config = adaptateur.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect((config.headers as AxiosHeaders).get('Authorization')).toBe('Bearer mon-token');
  });

  it("n'ajoute aucun en-tête Authorization sans token", async () => {
    mockGetToken.mockResolvedValue(null);
    adaptateur.mockImplementation(repondre(200));

    await api.get('/actualites');

    const config = adaptateur.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect((config.headers as AxiosHeaders).has('Authorization')).toBe(false);
  });

  it("pointe vers l'URL de l'API et demande du JSON", async () => {
    mockGetToken.mockResolvedValue(null);
    adaptateur.mockImplementation(repondre(200));

    await api.get('/actualites');

    const config = adaptateur.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect(config.baseURL).toBe('https://api.example.test');
    expect((config.headers as AxiosHeaders).get('Accept')).toBe('application/json');
  });

  it("efface la session sur une réponse 401 et propage l'erreur", async () => {
    mockGetToken.mockResolvedValue('token-expire');
    adaptateur.mockImplementation(repondre(401));

    await expect(api.get('/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(mockRemoveToken).toHaveBeenCalled();
  });

  // 📖 Session expirée (token de plus de 90 jours, ou révoqué) : sans redirection,
  //    l'utilisateur restait sur des écrans en erreur jusqu'au rechargement de l'app.
  it('renvoie vers la connexion sur un 401 avec token, une seule fois', async () => {
    mockGetToken.mockResolvedValue('token-expire');
    adaptateur.mockImplementation(repondre(401));

    await Promise.allSettled([api.get('/me'), api.get('/dons'), api.get('/badges')]);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/auth/login?session=expiree');
  });

  it('redirige de nouveau après une reconnexion', async () => {
    mockGetToken.mockResolvedValue('token');
    adaptateur.mockImplementation(repondre(401));
    await api.get('/me').catch(() => {});

    // Reconnexion : une requête repart avec un token, puis la session expire encore.
    await api.get('/me').catch(() => {});

    expect(mockReplace).toHaveBeenCalledTimes(2);
  });

  it('ne redirige pas sur un 401 sans token (mauvais mot de passe au login)', async () => {
    mockGetToken.mockResolvedValue(null);
    adaptateur.mockImplementation(repondre(401));

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ response: { status: 401 } });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // 📖 Le serveur de démo (Apache, dossier utilisateur) refuse PUT/PATCH/DELETE en 403
  //    avant Laravel : ces requêtes partent en POST, la vraie méthode dans l'en-tête.
  it.each([
    ['put', 'PUT'],
    ['patch', 'PATCH'],
    ['delete', 'DELETE'],
  ] as const)('envoie un %s en POST avec X-HTTP-Method-Override', async (methode, attendu) => {
    mockGetToken.mockResolvedValue('token');
    adaptateur.mockImplementation(repondre(200));

    await api[methode]('/notifications/lues');

    const config = adaptateur.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect(config.method).toBe('post');
    expect((config.headers as AxiosHeaders).get('X-HTTP-Method-Override')).toBe(attendu);
  });

  it('garde le corps de la requête, y compris celui d’un DELETE', async () => {
    mockGetToken.mockResolvedValue('token');
    adaptateur.mockImplementation(repondre(200));

    await api.put('/me', { pseudo: 'Lune' });
    await api.delete('/notifications/subscription', { data: { endpoint: 'https://fcm.example/x' } });

    const [put, del] = adaptateur.mock.calls.map((c) => c[0] as InternalAxiosRequestConfig);
    expect(JSON.parse(put.data)).toEqual({ pseudo: 'Lune' });
    expect(JSON.parse(del.data)).toEqual({ endpoint: 'https://fcm.example/x' });
  });

  it('laisse GET et POST tels quels', async () => {
    mockGetToken.mockResolvedValue('token');
    adaptateur.mockImplementation(repondre(200));

    await api.get('/me');
    await api.post('/scan', {});

    for (const [config] of adaptateur.mock.calls as [InternalAxiosRequestConfig][]) {
      expect((config.headers as AxiosHeaders).has('X-HTTP-Method-Override')).toBe(false);
    }
    expect(adaptateur.mock.calls.map((c) => c[0].method)).toEqual(['get', 'post']);
  });

  it('garde la session sur une autre erreur (ex. 422)', async () => {
    mockGetToken.mockResolvedValue('token');
    adaptateur.mockImplementation(repondre(422));

    await expect(api.post('/scan', {})).rejects.toMatchObject({ response: { status: 422 } });
    expect(mockRemoveToken).not.toHaveBeenCalled();
  });
});
