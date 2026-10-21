import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
} from '../../services/notifications.service';
import { useNotifications } from '../useNotifications';

jest.mock('../../services/notifications.service', () => ({
  getNotifications: jest.fn(),
  marquerNotificationLue: jest.fn(),
  marquerToutesNotificationsLues: jest.fn(),
}));

const mockGetNotifications = getNotifications as jest.Mock;
const mockMarquerLue = marquerNotificationLue as jest.Mock;
const mockMarquerToutes = marquerToutesNotificationsLues as jest.Mock;

const notif = (id: string, lue = false) => ({ id, titre: `Notif ${id}`, corps: '', lue, date: '2026-10-15' });

beforeEach(() => {
  jest.clearAllMocks();
  mockMarquerLue.mockResolvedValue(undefined);
  mockMarquerToutes.mockResolvedValue(undefined);
});

describe('useNotifications', () => {
  it('charge la première page au montage', async () => {
    mockGetNotifications.mockResolvedValue({ items: [notif('a')], pageSuivante: null });

    const { result } = await renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetNotifications).toHaveBeenCalledWith(1);
    expect(result.current.notifications).toEqual([notif('a')]);
  });

  it("est en chargement tant que le serveur n'a pas répondu", async () => {
    mockGetNotifications.mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => useNotifications());

    expect(result.current.loading).toBe(true);
    expect(result.current.notifications).toBeNull();
  });

  it('signale une erreur de chargement', async () => {
    mockGetNotifications.mockRejectedValue(new Error('réseau'));

    const { result } = await renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
  });

  it('ajoute la page suivante à la liste', async () => {
    mockGetNotifications
      .mockResolvedValueOnce({ items: [notif('a')], pageSuivante: 2 })
      .mockResolvedValueOnce({ items: [notif('b')], pageSuivante: null });
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.chargerPlus());

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));
    expect(mockGetNotifications).toHaveBeenLastCalledWith(2);
  });

  it('ne recharge rien une fois la dernière page atteinte', async () => {
    mockGetNotifications.mockResolvedValue({ items: [notif('a')], pageSuivante: null });
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.chargerPlus());

    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('marque une notification comme lue tout de suite, sans attendre le serveur', async () => {
    mockGetNotifications.mockResolvedValue({ items: [notif('a'), notif('b')], pageSuivante: null });
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.marquerLue('a'));

    expect(result.current.notifications?.map((n) => n.lue)).toEqual([true, false]);
    expect(mockMarquerLue).toHaveBeenCalledWith('a');
  });

  it('marque toutes les notifications comme lues', async () => {
    mockGetNotifications.mockResolvedValue({ items: [notif('a'), notif('b')], pageSuivante: null });
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.marquerToutesLues());

    expect(result.current.notifications?.every((n) => n.lue)).toBe(true);
    expect(mockMarquerToutes).toHaveBeenCalled();
  });

  it('garde le marquage local même si le serveur échoue', async () => {
    mockGetNotifications.mockResolvedValue({ items: [notif('a')], pageSuivante: null });
    mockMarquerLue.mockRejectedValue(new Error('réseau'));
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.marquerLue('a'));

    await waitFor(() => expect(result.current.notifications?.[0].lue).toBe(true));
  });

  it('recharger repart de la première page', async () => {
    mockGetNotifications.mockResolvedValue({ items: [notif('a')], pageSuivante: 2 });
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.recharger());

    expect(mockGetNotifications).toHaveBeenLastCalledWith(1);
  });
});
