import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getNotificationsActivees,
  getOnboardingVu,
  getPenurieActivee,
  setNotificationsActivees,
  setOnboardingVu,
  setPenurieActivee,
} from '../preferences';

// 📖 Mock officiel fourni par la librairie : un faux stockage en mémoire,
//    qui se comporte comme le vrai sans toucher à un appareil.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- import interdit dans une fabrique jest.mock
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// 📖 On vide le stockage avant chaque test pour qu'ils ne dépendent pas
//    les uns des autres.
beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('préférences de notifications', () => {
  it('sont désactivées par défaut', async () => {
    await expect(getNotificationsActivees()).resolves.toBe(false);
    await expect(getPenurieActivee()).resolves.toBe(false);
  });

  it("retiennent l'activation des notifications", async () => {
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

describe('onboarding vu', () => {
  it('vaut false à la première ouverture', async () => {
    await expect(getOnboardingVu()).resolves.toBe(false);
  });

  it("vaut true une fois l'onboarding marqué comme vu", async () => {
    await setOnboardingVu();

    await expect(getOnboardingVu()).resolves.toBe(true);
  });

  // 📖 Protège le nom de la clé : le changer ferait revoir l'onboarding à
  //    toutes les personnes qui l'ont déjà passé.
  it('est stocké sous la clé onboarding_vu', async () => {
    await setOnboardingVu();

    await expect(AsyncStorage.getItem('onboarding_vu')).resolves.toBe('true');
  });
});