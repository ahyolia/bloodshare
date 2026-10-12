// 📖 Abonnement Web Push (PWA). Les API du navigateur (Notification, serviceWorker,
//    PushManager) n'existent pas sous Jest : on les simule une par une. La clé VAPID est
//    lue au chargement du module, d'où le require() isolé dans chaque test.
//    Le cas « aucune clé VAPID » n'est pas testé : babel-preset-expo inscrit en dur la
//    valeur de .env.local à la transformation, process.env ne peut alors plus la retirer.

const mockApiPost = jest.fn();
const mockApiDelete = jest.fn();

jest.mock('../../api', () => ({
  __esModule: true,
  default: { post: (...args: unknown[]) => mockApiPost(...args), delete: (...args: unknown[]) => mockApiDelete(...args) },
}));

type Global = Record<string, unknown>;
const g = globalThis as unknown as Global;
const origines = { window: g.window, navigator: g.navigator, Notification: g.Notification };

// Clé publique VAPID d'exemple (utilisée seulement sans .env.local).
const charger = () => {
  process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ??=
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

  let module!: typeof import('../webPush.web');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules exige un require synchrone
    module = require('../webPush.web');
  });
  return module;
};

const simulerNavigateur = (permission: NotificationPermission, abonnementExistant: object | null = null) => {
  const abonnement = {
    endpoint: 'https://push.example.test/abc',
    toJSON: () => ({ endpoint: 'https://push.example.test/abc', keys: { p256dh: 'cle', auth: 'secret' } }),
    unsubscribe: jest.fn().mockResolvedValue(true),
  };
  const pushManager = {
    subscribe: jest.fn().mockResolvedValue(abonnement),
    getSubscription: jest.fn().mockResolvedValue(abonnementExistant ? abonnement : null),
  };
  const registration = { pushManager };

  g.window = { PushManager: function PushManager() {} };
  g.navigator = {
    serviceWorker: {
      register: jest.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      getRegistration: jest.fn().mockResolvedValue(registration),
    },
  };
  g.Notification = { requestPermission: jest.fn().mockResolvedValue(permission) };

  return { abonnement, pushManager };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApiPost.mockResolvedValue({});
  mockApiDelete.mockResolvedValue({});
});

afterEach(() => {
  g.window = origines.window;
  g.navigator = origines.navigator;
  g.Notification = origines.Notification;
});

describe('subscribe', () => {
  it('renvoie false sur un navigateur sans Web Push', async () => {
    g.window = {};
    g.navigator = {};

    await expect(charger().subscribe()).resolves.toBe(false);
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('renvoie false si l’utilisateur refuse la permission', async () => {
    const { pushManager } = simulerNavigateur('denied');

    await expect(charger().subscribe()).resolves.toBe(false);
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('abonne le navigateur et envoie l’abonnement au backend', async () => {
    const { pushManager } = simulerNavigateur('granted');

    await expect(charger().subscribe()).resolves.toBe(true);

    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) })
    );
    expect(mockApiPost).toHaveBeenCalledWith('/notifications/subscription', {
      endpoint: 'https://push.example.test/abc',
      keys: { p256dh: 'cle', auth: 'secret' },
    });
  });

  it('convertit la clé VAPID base64 URL-safe en 65 octets', async () => {
    const { pushManager } = simulerNavigateur('granted');

    await charger().subscribe();

    const { applicationServerKey } = pushManager.subscribe.mock.calls[0][0];
    // Une clé publique VAPID (P-256 non compressée) fait toujours 65 octets et commence par 0x04.
    expect(applicationServerKey).toHaveLength(65);
    expect(applicationServerKey[0]).toBe(0x04);
  });
});

describe('unsubscribe', () => {
  it('désabonne le navigateur et prévient le backend', async () => {
    const { abonnement } = simulerNavigateur('granted', {});

    await charger().unsubscribe();

    expect(abonnement.unsubscribe).toHaveBeenCalled();
    expect(mockApiDelete).toHaveBeenCalledWith('/notifications/subscription', {
      data: { endpoint: 'https://push.example.test/abc' },
    });
  });

  it('ne fait rien s’il n’y a aucun abonnement', async () => {
    simulerNavigateur('granted', null);

    await charger().unsubscribe();

    expect(mockApiDelete).not.toHaveBeenCalled();
  });
});
