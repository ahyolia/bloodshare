import api from '../api';
import { forgotPassword, login, logout, register } from '../auth.service';

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

describe('register', () => {
  const inscription = {
    pseudo: 'BloodHero42',
    email: 'user@example.com',
    password: 'MotDePasse123',
    password_confirmation: 'MotDePasse123',
    sexe: 'femme' as const,
    statut_donneur: 'quelques_dons',
    avatar_id: 3,
  };

  it('appelle POST /auth/register avec le formulaire complet', async () => {
    apiPost.mockResolvedValue(reponseApi);

    await register(inscription);

    expect(apiPost).toHaveBeenCalledWith('/auth/register', inscription);
  });

  it('transmet le code de parrainage quand il est fourni', async () => {
    apiPost.mockResolvedValue(reponseApi);

    await register({ ...inscription, code_parrainage: 'XYZ98765' });

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ code_parrainage: 'XYZ98765' })
    );
  });

  it('renvoie le token et le profil créé', async () => {
    apiPost.mockResolvedValue(reponseApi);

    const { token, user } = await register(inscription);

    expect(token).toBe('1|abcdef');
    expect(user.pseudo).toBe('BloodHero42');
  });

  it("écarte les champs hors liste blanche renvoyés par l'API (contrainte anonymat)", async () => {
    apiPost.mockResolvedValue(reponseApi);

    const { user } = await register(inscription);

    expect(user).not.toHaveProperty('groupe_sanguin');
  });

  // 📖 C'est sur cette erreur que repose tout l'affichage des messages par
  //    étape dans l'écran d'inscription : si le service avalait la réponse 422,
  //    l'écran n'aurait plus aucun champ à signaler.
  it('propage la réponse 422 pour que l\'écran puisse cibler le champ fautif', async () => {
    const erreur422 = {
      response: {
        status: 422,
        data: {
          message: "Ce code de parrainage n'existe pas.",
          errors: { code_parrainage: ["Ce code de parrainage n'existe pas."] },
        },
      },
    };
    apiPost.mockRejectedValue(erreur422);

    await expect(register(inscription)).rejects.toMatchObject({
      response: { status: 422 },
    });
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
