import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  NotificationItem,
} from '../services/notifications.service';

// 📖 Charge l'historique des notifications (paginé) et expose les actions de lecture.
// Mise à jour optimiste côté liste (pas de rechargement complet après un marquage).
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [chargementSuite, setChargementSuite] = useState(false);
  const [error, setError] = useState(false);
  const pageSuivante = useRef<number | null>(1);

  const charger = useCallback(() => {
    setLoading(true);
    setError(false);
    pageSuivante.current = 1;

    return getNotifications(1)
      .then((page) => {
        setNotifications(page.items);
        pageSuivante.current = page.pageSuivante;
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // 📖 Appelé par onEndReached : current_page/last_page de la réponse Laravel disent
  // s'il reste une page à charger. "Tout marquer comme lu" agit côté serveur sur TOUTES
  // les notifs (pas seulement celles déjà chargées) : les pages suivantes, une fois
  // récupérées, arrivent donc déjà marquées lues par l'API.
  const chargerPlus = useCallback(() => {
    if (chargementSuite || pageSuivante.current === null) return;

    setChargementSuite(true);
    getNotifications(pageSuivante.current)
      .then((page) => {
        setNotifications((prev) => (prev ? [...prev, ...page.items] : page.items));
        pageSuivante.current = page.pageSuivante;
      })
      .catch(() => {})
      .finally(() => setChargementSuite(false));
  }, [chargementSuite]);

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

  return {
    notifications,
    loading,
    chargementSuite,
    error,
    marquerLue,
    marquerToutesLues,
    chargerPlus,
    recharger: charger,
  };
}
