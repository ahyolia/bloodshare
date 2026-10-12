import { renderHook, waitFor } from '@testing-library/react-native';
import { getNotificationsNonLuesCount } from '../../services/notifications.service';
import { useNotificationsNonLues } from '../useNotificationsNonLues';

jest.mock('../../services/notifications.service', () => ({
  getNotificationsNonLuesCount: jest.fn(),
}));

// 📖 Hors navigation réelle, on simule useFocusEffect comme un simple effet au montage.
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- import interdit dans une fabrique jest.mock
  const { useEffect } = require('react');
  return { useFocusEffect: (effet: () => void) => useEffect(effet, [effet]) };
});

const mockCount = getNotificationsNonLuesCount as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useNotificationsNonLues', () => {
  it('vaut 0 avant la réponse du serveur', async () => {
    mockCount.mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => useNotificationsNonLues());

    expect(result.current).toBe(0);
  });

  it('renvoie le nombre de notifications non lues', async () => {
    mockCount.mockResolvedValue(3);

    const { result } = await renderHook(() => useNotificationsNonLues());

    await waitFor(() => expect(result.current).toBe(3));
  });

  it('reste à 0 si l’appel échoue (pas de pastille plutôt qu’un plantage)', async () => {
    mockCount.mockRejectedValue(new Error('réseau'));

    const { result } = await renderHook(() => useNotificationsNonLues());

    await waitFor(() => expect(mockCount).toHaveBeenCalled());
    expect(result.current).toBe(0);
  });
});
