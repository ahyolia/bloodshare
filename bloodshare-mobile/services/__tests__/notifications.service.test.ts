import api from '../api';
import {
  getNotifications,
  getNotificationsNonLuesCount,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
} from '../notifications.service';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}));

const apiGet = api.get as jest.Mock;
const apiPut = api.put as jest.Mock;

// Réponse réelle de GET /notifications : pagination Laravel.
const page = (current_page: number, last_page: number, data: object[] = []) => ({
  data: { data, current_page, last_page },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getNotifications', () => {
  it('demande la page voulue à GET /notifications', async () => {
    apiGet.mockResolvedValue(page(2, 3));

    await getNotifications(2);

    expect(apiGet).toHaveBeenCalledWith('/notifications', { params: { page: 2 } });
  });

  it('demande la première page par défaut', async () => {
    apiGet.mockResolvedValue(page(1, 1));

    await getNotifications();

    expect(apiGet).toHaveBeenCalledWith('/notifications', { params: { page: 1 } });
  });

  it('renomme `created_at` en `date`', async () => {
    apiGet.mockResolvedValue(
      page(1, 1, [
        { id: 'a', titre: 'Badge', corps: 'Bravo', lue: false, categorie: 'badge', created_at: '2026-10-15T10:00:00Z' },
      ])
    );

    const { items } = await getNotifications();

    expect(items).toEqual([
      { id: 'a', titre: 'Badge', corps: 'Bravo', lue: false, categorie: 'badge', date: '2026-10-15T10:00:00Z' },
    ]);
  });

  it('donne un titre, un corps et une catégorie par défaut à une notification incomplète', async () => {
    apiGet.mockResolvedValue(page(1, 1, [{ id: 'a', titre: null, corps: null, lue: true, created_at: '2026-10-15' }]));

    const { items } = await getNotifications();

    expect(items[0].titre).toBe('Notification');
    expect(items[0].corps).toBe('');
    expect(items[0].categorie).toBe('autre');
  });

  it("indique la page suivante tant qu'il en reste", async () => {
    apiGet.mockResolvedValue(page(1, 3));

    await expect(getNotifications()).resolves.toMatchObject({ pageSuivante: 2 });
  });

  it('indique null sur la dernière page', async () => {
    apiGet.mockResolvedValue(page(3, 3));

    await expect(getNotifications(3)).resolves.toMatchObject({ pageSuivante: null });
  });
});

describe('getNotificationsNonLuesCount', () => {
  it('renvoie le compteur de GET /notifications/non-lues', async () => {
    apiGet.mockResolvedValue({ data: { count: 4 } });

    await expect(getNotificationsNonLuesCount()).resolves.toBe(4);
    expect(apiGet).toHaveBeenCalledWith('/notifications/non-lues');
  });
});

describe('marquage comme lu', () => {
  it('marquerNotificationLue appelle PUT /notifications/:id/lue', async () => {
    apiPut.mockResolvedValue({});

    await marquerNotificationLue('abc');

    expect(apiPut).toHaveBeenCalledWith('/notifications/abc/lue');
  });

  it('marquerToutesNotificationsLues appelle PUT /notifications/lues', async () => {
    apiPut.mockResolvedValue({});

    await marquerToutesNotificationsLues();

    expect(apiPut).toHaveBeenCalledWith('/notifications/lues');
  });
});
