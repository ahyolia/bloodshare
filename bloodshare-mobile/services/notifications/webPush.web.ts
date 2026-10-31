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

// L'abonnement a-t-il été créé avec cette clé VAPID ?
function memeCle(abonnement: PushSubscription, cle: Uint8Array): boolean {
  const cleAbonnement = abonnement.options?.applicationServerKey;
  if (!cleAbonnement) return false;
  const octets = new Uint8Array(cleAbonnement);
  return octets.length === cle.length && octets.every((octet, i) => octet === cle[i]);
}

// 📖 Un abonnement créé avec une ancienne clé VAPID ne reçoit plus rien (le service
//    push refuse les envois en 403) et le navigateur refuse d'en créer un autre tant
//    qu'il existe : on le retire d'abord, puis on s'abonne avec la clé actuelle.
async function abonner(registration: ServiceWorkerRegistration, cleVapid: string): Promise<void> {
  const cle = urlBase64ToUint8Array(cleVapid);
  const existant = await registration.pushManager.getSubscription();
  if (existant && !memeCle(existant, cle)) {
    await existant.unsubscribe();
    // Le backend le supprimerait au prochain envoi refusé ; autant le faire tout de suite.
    await api.delete('/notifications/subscription', { data: { endpoint: existant.endpoint } }).catch(() => {});
  }

  const abonnement = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: cle as BufferSource,
  });

  await api.post('/notifications/subscription', abonnement.toJSON());
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
  await abonner(registration, VAPID_PUBLIC_KEY);

  return true;
}

/**
 * Au lancement : si les notifications sont actives mais que l'abonnement du navigateur
 * a été créé avec une autre clé VAPID (clés régénérées côté serveur), on le refait.
 * Sans abonnement existant, on ne fait rien : l'utilisateur les a peut-être désactivées.
 */
export async function verifierAbonnement(): Promise<void> {
  if (!aSupportPush() || !VAPID_PUBLIC_KEY || Notification.permission !== 'granted') return;

  const registration = await navigator.serviceWorker.getRegistration();
  const existant = await registration?.pushManager.getSubscription();
  if (!registration || !existant) return;
  if (memeCle(existant, urlBase64ToUint8Array(VAPID_PUBLIC_KEY))) return;

  await abonner(registration, VAPID_PUBLIC_KEY);
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
