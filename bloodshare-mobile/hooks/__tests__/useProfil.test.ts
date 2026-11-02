import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getBadgesResume } from '../../services/badges.service';
import { getDons } from '../../services/dons.service';
import { getProfil } from '../../services/profil.service';
import { getUser, saveUser } from '../../stores/auth.store';
import { useProfil } from '../useProfil';
import { useProfilComplet } from '../useProfilComplet';

jest.mock('../../services/profil.service', () => ({ getProfil: jest.fn() }));
jest.mock('../../services/dons.service', () => ({ getDons: jest.fn() }));
jest.mock('../../services/badges.service', () => ({ getBadgesResume: jest.fn() }));
jest.mock('../../stores/auth.store', () => ({ getUser: jest.fn(), saveUser: jest.fn() }));

const mockGetProfil = getProfil as jest.Mock;
const mockGetDons = getDons as jest.Mock;
const mockGetBadges = getBadgesResume as jest.Mock;
const mockGetUser = getUser as jest.Mock;
const mockSaveUser = saveUser as jest.Mock;

const profil = {
  id: 1,
  pseudo: 'Goutte',
  avatar_url: null,
  points_cumules: 150,
  niveau: { niveau: 2, label: 'Informé' },
  code_parrainage: 'ABCD1234',
  nb_parrainages_valides: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveUser.mockResolvedValue(undefined);
});

describe('useProfil', () => {
  it('charge le profil', async () => {
    mockGetProfil.mockResolvedValue(profil);

    const { result } = await renderHook(() => useProfil());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profil).toEqual(profil);
    expect(result.current.error).toBe(false);
  });

  it("est en chargement tant que le serveur n'a pas répondu", async () => {
    mockGetProfil.mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => useProfil());

    expect(result.current.loading).toBe(true);
    expect(result.current.profil).toBeNull();
  });

  it('signale une erreur de chargement', async () => {
    mockGetProfil.mockRejectedValue(new Error('réseau'));

    const { result } = await renderHook(() => useProfil());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.profil).toBeNull();
  });
});

describe('useProfilComplet', () => {
  const dons = { total_dons: 2, dons: [] };
  const badges = { obtenus: 1, total: 6 };

  it("affiche d'abord l'aperçu en cache, puis les données fraîches", async () => {
    mockGetUser.mockResolvedValue({ pseudo: 'AncienPseudo', points_cumules: 100 });
    mockGetProfil.mockResolvedValue(profil);
    mockGetDons.mockResolvedValue(dons);
    mockGetBadges.mockResolvedValue(badges);

    const { result } = await renderHook(() => useProfilComplet());

    await waitFor(() => expect(result.current.apercu?.pseudo).toBe('AncienPseudo'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profil).toEqual(profil);
    expect(result.current.dons).toEqual(dons);
    expect(result.current.badges).toEqual(badges);
  });

  it('met à jour le cache local avec le profil frais', async () => {
    mockGetUser.mockResolvedValue({ pseudo: 'AncienPseudo', points_cumules: 100 });
    mockGetProfil.mockResolvedValue(profil);
    mockGetDons.mockResolvedValue(dons);
    mockGetBadges.mockResolvedValue(badges);

    const { result } = await renderHook(() => useProfilComplet());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockSaveUser).toHaveBeenCalledWith(
      expect.objectContaining({ pseudo: 'Goutte', points_cumules: 150, code_parrainage: 'ABCD1234' })
    );
  });

  it('fonctionne sans cache local (premier lancement)', async () => {
    mockGetUser.mockResolvedValue(null);
    mockGetProfil.mockResolvedValue(profil);
    mockGetDons.mockResolvedValue(dons);
    mockGetBadges.mockResolvedValue(badges);

    const { result } = await renderHook(() => useProfilComplet());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.apercu).toBeNull();
    expect(result.current.profil).toEqual(profil);
  });

  it('signale une erreur si un des trois appels échoue', async () => {
    mockGetUser.mockResolvedValue(null);
    mockGetProfil.mockResolvedValue(profil);
    mockGetDons.mockRejectedValue(new Error('réseau'));
    mockGetBadges.mockResolvedValue(badges);

    const { result } = await renderHook(() => useProfilComplet());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(mockSaveUser).not.toHaveBeenCalled();
  });

  it("reload efface l'erreur une fois le réseau revenu", async () => {
    mockGetUser.mockResolvedValue(null);
    mockGetProfil.mockRejectedValueOnce(new Error('réseau')).mockResolvedValue(profil);
    mockGetDons.mockResolvedValue(dons);
    mockGetBadges.mockResolvedValue(badges);
    const { result } = await renderHook(() => useProfilComplet());
    await waitFor(() => expect(result.current.error).toBe(true));

    await act(() => result.current.reload());

    expect(result.current.error).toBe(false);
    expect(result.current.profil).toEqual(profil);
  });
});
