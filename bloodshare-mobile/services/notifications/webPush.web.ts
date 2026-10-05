import api from '../api';

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

// 📖 Le navigateur attend la clé VAPID en Uint8Array, le backend la fournit en
//    base64 URL-safe (format standard des clés VAPID) : conversion nécessaire,
//    il n'existe pas d'équivalent natif à atob+Uint8Array pour ce format.
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function aSupportPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export async function subscribe(): Promise<boolean> {
  if (!aSupportPush() || !VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  await navigator.serviceWorker.register('/sw.js');
  // 📖 register() se résout dès l'enregistrement créé, pas une fois le service
  //    worker actif : s'abonner tout de suite échoue parfois avec "no active
  //    Service Worker". `.ready` n'aboutit qu'une fois un worker réellement actif.
  const registration = await navigator.serviceWorker.ready;
  const abonnement = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  });

  await api.post('/notifications/subscription', abonnement.toJSON());

  return true;
}

export async function unsubscribe(): Promise<void> {
  if (!aSupportPush()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const abonnement = await registration?.pushManager.getSubscription();
  if (!abonnement) return;

  const endpoint = abonnement.endpoint;
  await abonnement.unsubscribe();
  await api.delete('/notifications/subscription', { data: { endpoint } });
}
