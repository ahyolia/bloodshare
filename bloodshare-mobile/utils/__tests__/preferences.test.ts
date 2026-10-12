import AsyncStorage from '@react-native-async-storage/async-storage';
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