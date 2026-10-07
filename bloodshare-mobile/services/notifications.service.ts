import api from './api';

export type NotificationItem = {
  id: string;
  titre: string;
  corps: string;
  lue: boolean;
  date: string; // ISO 8601
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
};

// Adaptateur : l'UI attend { titre, corps } toujours renseignés (fallback si une
// notif ancienne n'a pas ces clés en data JSON) et `date` plutôt que `created_at`.
export const getNotifications = async (): Promise<NotificationItem[]> => {
  const response = await api.get<NotificationsPageApi>('/notifications');
  return response.data.data.map((notif) => ({
    id: notif.id,
    titre: notif.titre ?? 'Notification',
    corps: notif.corps ?? '',
    lue: notif.lue,
    date: notif.created_at,
  }));
};

export const marquerNotificationLue = async (id: string): Promise<void> => {
  await api.put(`/notifications/${id}/lue`);
};

export const marquerToutesNotificationsLues = async (): Promise<void> => {
  await api.put('/notifications/lues');
};
