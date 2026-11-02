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
      // Page de l'app liée à la notification (data.url, posé par le backend).
      data: payload.data,
    })
  );
});

// Au clic : ouvre la page liée (quiz, événement, badges…), dans l'onglet de l'app s'il
// est déjà ouvert, sinon dans un nouveau. Sans lien : l'accueil.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const onglet = clients.find((c) => new URL(c.url).origin === self.location.origin);
      if (onglet) {
        return onglet.focus().then((c) => (c.navigate ? c.navigate(url) : c));
      }
      return self.clients.openWindow(url);
    })
  );
});
