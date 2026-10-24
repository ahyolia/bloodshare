import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getBadgesAFeter, marquerBadgeFete } from '../../services/badges.service';
import { useBadgesAFeter } from '../useBadgesAFeter';

jest.mock('../../services/badges.service', () => ({
  getBadgesAFeter: jest.fn(),
  marquerBadgeFete: jest.fn(() => Promise.resolve()),
}));

let mockPathname = '/tabs';
jest.mock('expo-router', () => ({ usePathname: () => mockPathname }));

const mockGet = getBadgesAFeter as jest.Mock;
const mockMarquer = marquerBadgeFete as jest.Mock;

const badge = (n: number) => ({ notificationId: `n${n}`, id: n, nom: `Badge ${n}`, image_url: null });

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = '/tabs';
});

describe('useBadgesAFeter', () => {
  it('affiche les badges un par un et marque chacun comme fêté à la fermeture', async () => {
    mockGet.mockResolvedValue([badge(1), badge(2)]);

    const { result } = await renderHook(() => useBadgesAFeter());

    await waitFor(() => expect(result.current.badge?.id).toBe(1), { timeout: 2000 });

    await act(async () => result.current.fermer());
    expect(mockMarquer).toHaveBeenCalledWith(badge(1));
    expect(result.current.badge?.id).toBe(2);

    await act(async () => result.current.fermer());
    expect(result.current.badge).toBeNull();
  });

  it("ne réaffiche pas un badge fermé si le serveur le renvoie encore", async () => {
    mockGet.mockResolvedValue([badge(1)]);

    const { result, rerender } = await renderHook(() => useBadgesAFeter());
    await waitFor(() => expect(result.current.badge?.id).toBe(1), { timeout: 2000 });
    await act(async () => result.current.fermer());

    // Changement d'écran : nouvelle vérification, le serveur n'a pas encore pris la lecture.
    mockPathname = '/tabs/quiz';
    await rerender({});
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2), { timeout: 2000 });

    expect(result.current.badge).toBeNull();
  });

  it("n'affiche rien si la vérification échoue", async () => {
    mockGet.mockRejectedValue(new Error('réseau'));

    const { result } = await renderHook(() => useBadgesAFeter());
    await waitFor(() => expect(mockGet).toHaveBeenCalled(), { timeout: 2000 });

    expect(result.current.badge).toBeNull();
  });
});
