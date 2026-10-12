import AsyncStorage from '@react-native-async-storage/async-storage';
<<<<<<< HEAD
import { getOnboardingVu, setOnboardingVu } from '../preferences';

// 📖 Mock officiel fourni par la librairie : un faux stockage en mémoire,
//    qui se comporte comme le vrai sans toucher à un appareil.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('onboarding vu', () => {
  beforeEach(async () => {
    // 📖 On vide le stockage avant chaque test pour qu'ils ne dépendent pas
    //    les uns des autres.
    await AsyncStorage.clear();
  });

  it('vaut false à la première ouverture', async () => {
    expect(await getOnboardingVu()).toBe(false);
  });

  it('vaut true une fois l’onboarding marqué comme vu', async () => {
    await setOnboardingVu();

    expect(await getOnboardingVu()).toBe(true);
  });
});
=======
import {
  getNotificationsActivees,
  getPenurieActivee,
  setNotificationsActivees,
  setPenurieActivee,
} from '../preferences';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- import interdit dans une fabrique jest.mock
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('préférences de notifications', () => {
  it('sont désactivées par défaut', async () => {
    await expect(getNotificationsActivees()).resolves.toBe(false);
    await expect(getPenurieActivee()).resolves.toBe(false);
  });

  it('retiennent l’activation des notifications', async () => {
    await setNotificationsActivees(true);

    await expect(getNotificationsActivees()).resolves.toBe(true);
  });

  it('retiennent la désactivation après une activation', async () => {
    await setNotificationsActivees(true);
    await setNotificationsActivees(false);

    await expect(getNotificationsActivees()).resolves.toBe(false);
  });

  it('gèrent les alertes pénurie indépendamment des notifications', async () => {
    await setPenurieActivee(true);

    await expect(getPenurieActivee()).resolves.toBe(true);
    await expect(getNotificationsActivees()).resolves.toBe(false);
  });

  it('stockent les booléens sous forme de chaîne', async () => {
    await setPenurieActivee(true);

    await expect(AsyncStorage.getItem('penurie_alertes_enabled')).resolves.toBe('true');
  });
});
>>>>>>> origin/dev
