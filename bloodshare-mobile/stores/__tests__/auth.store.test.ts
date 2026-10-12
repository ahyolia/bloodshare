import { secureStorage } from '../../services/storage/secureStorage';
import { getToken, getUser, removeToken, saveToken, saveUser } from '../auth.store';

// 📖 Faux stockage en mémoire à la place du Keychain / Keystore.
jest.mock('../../services/storage/secureStorage', () => {
  const memoire = new Map<string, string>();
  return {
    secureStorage: {
      getItem: jest.fn(async (cle: string) => memoire.get(cle) ?? null),
      setItem: jest.fn(async (cle: string, valeur: string) => {
        memoire.set(cle, valeur);
      }),
      removeItem: jest.fn(async (cle: string) => {
        memoire.delete(cle);
      }),
      __memoire: memoire,
    },
  };
});

const memoire = (secureStorage as unknown as { __memoire: Map<string, string> }).__memoire;

beforeEach(() => {
  memoire.clear();
  jest.clearAllMocks();
});

describe('token', () => {
  it('enregistre puis relit le token', async () => {
    await saveToken('abc123');

    await expect(getToken()).resolves.toBe('abc123');
  });

  it('renvoie null quand aucun token n’est enregistré', async () => {
    await expect(getToken()).resolves.toBeNull();
  });
});

describe('utilisateur', () => {
  it('enregistre l’utilisateur en JSON et le relit en objet', async () => {
    await saveUser({ pseudo: 'Goutte', points_cumules: 120 });

    expect(secureStorage.setItem).toHaveBeenCalledWith('auth_user', '{"pseudo":"Goutte","points_cumules":120}');
    await expect(getUser()).resolves.toEqual({ pseudo: 'Goutte', points_cumules: 120 });
  });

  it('renvoie null quand aucun utilisateur n’est enregistré', async () => {
    await expect(getUser()).resolves.toBeNull();
  });
});

describe('removeToken (déconnexion)', () => {
  it('efface à la fois le token et l’utilisateur', async () => {
    await saveToken('abc123');
    await saveUser({ pseudo: 'Goutte' });

    await removeToken();

    await expect(getToken()).resolves.toBeNull();
    await expect(getUser()).resolves.toBeNull();
  });
});
