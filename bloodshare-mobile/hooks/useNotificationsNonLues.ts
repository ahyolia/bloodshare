import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getNotificationsNonLuesCount } from '../services/notifications.service';

// 📖 Recharge le compteur à chaque focus de l'onglet (et pas juste au montage) :
// sans ça, la pastille resterait affichée après une visite sur l'écran Notifications
// qui a marqué des notifs comme lues, jusqu'au prochain rechargement complet de l'app.
export function useNotificationsNonLues() {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getNotificationsNonLuesCount()
        .then(setCount)
        .catch(() => {});
    }, [])
  );

  return count;
}
