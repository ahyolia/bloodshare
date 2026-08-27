import api from '../api';
import { getProfil } from '../profil.service';

jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

// Réponse réelle de GET /me (ProfilController::formatUser) : elle contient `sexe`,
// une donnée d'identité que CONTRIBUTING.md interdit de conserver.
const reponseApi = {
  data: {
    id: 12,
    pseudo: 'BloodHero42',
    avatar_url: null,
    statut_donneur: 'quelques_dons',
    sexe: 'homme',
    points_cumules: 250,
    niveau: {
      niveau: 3,
      label: 'Donneur engagé',
      points_actuels: 250,
      points_prochain_niveau: 400,
      progression: 62,
    },
    code_parrainage: 'XYZ98765',
    statut: 'actif',
    created_at: '2026-01-15T10:00:00Z',
    derniere_connexion: '2026-06-20T08:30:00Z',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getProfil', () => {
  it('appelle GET /me', async () => {
    apiGet.mockResolvedValue(reponseApi);

    await getProfil();

    expect(apiGet).toHaveBeenCalledWith('/me');
  });

  it('renvoie le pseudo, les points et le niveau', async () => {
    apiGet.mockResolvedValue(reponseApi);

    const profil = await getProfil();

    expect(profil.pseudo).toBe('BloodHero42');
    expect(profil.points_cumules).toBe(250);
    expect(profil.niveau.niveau).toBe(3);
  });

  it('écarte le sexe renvoyé par l’API (contrainte anonymat)', async () => {
    apiGet.mockResolvedValue(reponseApi);

    const profil = await getProfil();

    expect(profil).not.toHaveProperty('sexe');
  });
});
