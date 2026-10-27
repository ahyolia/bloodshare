import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  NotificationItem,
} from '../services/notifications.service';

type Options = {
  /** Appelé quand le serveur refuse un marquage : l'écran prévient la personne. */
  onErreurMarquage?: () => void;
};

// 📖 Charge l'historique des notifications (paginé) et expose les actions de lecture.
// Mise à jour optimiste côté liste (pas de rechargement complet après un marquage),
// annulée si le serveur refuse : sinon la notif redeviendrait non lue au rechargement
// sans que personne ne comprenne pourquoi.
export function useNotifications({ onErreurMarquage }: Options = {}) {
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  // Ref : l'écran passe une nouvelle fonction à chaque rendu, les actions restent stables.
  const prevenirErreur = useRef(onErreurMarquage);
  // Liste courante, lisible sans attendre que React applique une mise à jour en cours.
  const courantes = useRef(notifications);
  // 📖 Mises à jour après le rendu (et non pendant) : React interdit d'écrire une ref
  //    en plein rendu. Un clic arrive toujours après, les valeurs sont donc à jour.
  useEffect(() => {
    prevenirErreur.current = onErreurMarquage;
    courantes.current = notifications;
  });
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

  // Remet en « non lues » les notifications dont le marquage a échoué.
  const annuler = useCallback((ids: string[]) => {
    setNotifications((prev) => (prev ? prev.map((n) => (ids.includes(n.id) ? { ...n, lue: false } : n)) : prev));
    prevenirErreur.current?.();
  }, []);

  const marquerLue = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev ? prev.map((n) => (n.id === id ? { ...n, lue: true } : n)) : prev
      );
      return marquerNotificationLue(id).catch(() => annuler([id]));
    },
    [annuler]
  );

  const marquerToutesLues = useCallback(() => {
    // 📖 On retient celles qui étaient non lues : une annulation ne doit pas faire
    //    repasser en « non lues » des notifications déjà lues avant le clic. Lu avant
    //    setNotifications, dont React peut différer l'exécution après l'échec du serveur.
    const nonLues = (courantes.current ?? []).filter((n) => !n.lue).map((n) => n.id);
    setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, lue: true })) : prev));
    return marquerToutesNotificationsLues().catch(() => annuler(nonLues));
  }, [annuler]);

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
