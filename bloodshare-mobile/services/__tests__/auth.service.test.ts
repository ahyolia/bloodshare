import api from '../api';
import { forgotPassword, login, logout } from '../auth.service';

// On force le mode API : sans ça, les services renverraient le mock et
// aucun appel réseau ne serait vérifiable.
jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

const apiPost = api.post as jest.Mock;

const reponseApi = {
  data: {
    token: '1|abcdef',
    user: {
      id: 12,
      pseudo: 'BloodHero42',
      avatar_url: null,
      statut_donneur: 'quelques_dons',
      groupe_sanguin: 'O+',
      points_cumules: 250,
      code_parrainage: 'XYZ98765',
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login', () => {
  it('appelle POST /auth/login avec les identifiants', async () => {
    apiPost.mockResolvedValue(reponseApi);

    await login('user@example.com', 'MotDePasse123');

    expect(apiPost).toHaveBeenCalledWith('/auth/login', {
      email: 'user@example.com',
      password: 'MotDePasse123',
    });
  });

  it('renvoie le token et le pseudo', async () => {
    apiPost.mockResolvedValue(reponseApi);

    const { token, user } = await login('user@example.com', 'MotDePasse123');

    expect(token).toBe('1|abcdef');
    expect(user.pseudo).toBe('BloodHero42');
    expect(user.points_cumules).toBe(250);
  });

  it("écarte le groupe sanguin renvoyé par l'API (contrainte anonymat)", async () => {
    apiPost.mockResolvedValue(reponseApi);

    const { user } = await login('user@example.com', 'MotDePasse123');

    expect(user).not.toHaveProperty('groupe_sanguin');
  });
});

describe('logout', () => {
  it('appelle POST /auth/logout', async () => {
    apiPost.mockResolvedValue({ data: { message: 'Déconnexion réussie.' } });

    await logout();

    expect(apiPost).toHaveBeenCalledWith('/auth/logout');
  });

  it("propage l'erreur si le serveur est injoignable", async () => {
    apiPost.mockRejectedValue(new Error('Network Error'));

    await expect(logout()).rejects.toThrow('Network Error');
  });
});

describe('forgotPassword', () => {
  it("appelle POST /auth/forgot-password avec l'email", async () => {
    apiPost.mockResolvedValue({ data: { message: 'Email de réinitialisation envoyé.' } });

    await forgotPassword('user@example.com');

    expect(apiPost).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'user@example.com',
    });
  });
});
