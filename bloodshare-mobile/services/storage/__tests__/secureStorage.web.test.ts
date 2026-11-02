import { secureStorage } from '../secureStorage.web';

// 📖 Version PWA du stockage : elle s'appuie sur localStorage, et doit rester sans effet
//    (sans planter) quand il n'existe pas — rendu serveur, navigation privée stricte.
const globalAvecWindow = globalThis as unknown as { window?: { localStorage?: Storage }; localStorage?: Storage };

const fauxLocalStorage = (): Storage => {
  const memoire = new Map<string, string>();
  return {
    getItem: (cle: string) => memoire.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => void memoire.set(cle, valeur),
    removeItem: (cle: string) => void memoire.delete(cle),
    clear: () => memoire.clear(),
    key: () => null,
    get length() {
      return memoire.size;
    },
  };
};

const windowOrigine = globalAvecWindow.window;
const localStorageOrigine = globalAvecWindow.localStorage;

afterEach(() => {
  globalAvecWindow.window = windowOrigine;
  globalAvecWindow.localStorage = localStorageOrigine;
});

describe('secureStorage (web)', () => {
  it('lit, écrit et efface dans localStorage', async () => {
    const stockage = fauxLocalStorage();
    globalAvecWindow.window = { localStorage: stockage };
    globalAvecWindow.localStorage = stockage;

    await secureStorage.setItem('auth_token', 'abc');
    await expect(secureStorage.getItem('auth_token')).resolves.toBe('abc');

    await secureStorage.removeItem('auth_token');
    await expect(secureStorage.getItem('auth_token')).resolves.toBeNull();
  });

  it('renvoie null et ne plante pas sans localStorage', async () => {
    globalAvecWindow.window = {};

    await expect(secureStorage.setItem('auth_token', 'abc')).resolves.toBeUndefined();
    await expect(secureStorage.getItem('auth_token')).resolves.toBeNull();
    await expect(secureStorage.removeItem('auth_token')).resolves.toBeUndefined();
  });
});
