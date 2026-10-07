import { useCallback, useEffect, useState } from 'react';
import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  NotificationItem,
} from '../services/notifications.service';

// 📖 Charge l'historique des notifications et expose les actions de lecture.
// Mise à jour optimiste côté liste (pas de rechargement complet après un marquage).
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const charger = useCallback(() => {
    setLoading(true);
    setError(false);

    return getNotifications()
      .then(setNotifications)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const marquerLue = useCallback((id: string) => {
    setNotifications((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, lue: true } : n)) : prev
    );
    marquerNotificationLue(id).catch(() => {});
  }, []);

  const marquerToutesLues = useCallback(() => {
    setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, lue: true })) : prev));
    marquerToutesNotificationsLues().catch(() => {});
  }, []);

  return { notifications, loading, error, marquerLue, marquerToutesLues, recharger: charger };
}
