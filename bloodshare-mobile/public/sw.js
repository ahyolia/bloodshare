// Service worker minimal pour la PWA : reçoit les push du backend et affiche
// la notification. Pas de cache applicatif ici — seul le flux notifications
// est couvert pour cette itération.

self.addEventListener('push', (event) => {
  let payload = { title: 'Aïma', body: '' };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data?.text() ?? '';
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
