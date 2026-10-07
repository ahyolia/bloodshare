import api from './api';

export type NotificationItem = {
  id: string;
  titre: string;
  corps: string;
  lue: boolean;
  date: string; // ISO 8601
};

export type NotificationsPage = {
  items: NotificationItem[];
  pageSuivante: number | null;
};

// Contrat réel de GET /notifications : pagination Laravel, avec data: [{ id, titre, corps, lue, created_at }].
type NotificationApi = {
  id: string;
  titre: string | null;
  corps: string | null;
  lue: boolean;
  created_at: string;
};

type NotificationsPageApi = {
  data: NotificationApi[];
  current_page: number;
  last_page: number;
};

// Adaptateur : l'UI attend { titre, corps } toujours renseignés (fallback si une
// notif ancienne n'a pas ces clés en data JSON), `date` plutôt que `created_at`, et
// `pageSuivante` (null une fois la dernière page atteinte) plutôt que current_page/last_page.
export const getNotifications = async (page = 1): Promise<NotificationsPage> => {
  const response = await api.get<NotificationsPageApi>('/notifications', { params: { page } });
  const { data, current_page, last_page } = response.data;

  return {
    items: data.map((notif) => ({
      id: notif.id,
      titre: notif.titre ?? 'Notification',
      corps: notif.corps ?? '',
      lue: notif.lue,
      date: notif.created_at,
    })),
    pageSuivante: current_page < last_page ? current_page + 1 : null,
  };
};

export const getNotificationsNonLuesCount = async (): Promise<number> => {
  const response = await api.get<{ count: number }>('/notifications/non-lues');
  return response.data.count;
};

export const marquerNotificationLue = async (id: string): Promise<void> => {
  await api.put(`/notifications/${id}/lue`);
};

export const marquerToutesNotificationsLues = async (): Promise<void> => {
  await api.put('/notifications/lues');
};
