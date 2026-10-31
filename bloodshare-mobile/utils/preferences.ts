import AsyncStorage from '@react-native-async-storage/async-storage';

// 📖 Préférences d'affichage NON sensibles (aucun secret, aucune donnée
//    d'identité) → AsyncStorage, pas SecureStore. SecureStore chiffre chaque
//    valeur via le keychain iOS / keystore Android : lent, quota ~2 Ko, réservé
//    au token d'auth. Un simple booléen de réglage n'a pas besoin de ça.
const CLES = {
  notifications: 'notifications_enabled',
  penurie: 'penurie_alertes_enabled',
  onboardingVu: 'onboarding_vu',
} as const;

// 📖 AsyncStorage ne stocke que des chaînes → on sérialise en 'true' / 'false'.
//    Valeur par défaut si la clé n'a jamais été écrite : `defaut`.
const lireBool = async (cle: string, defaut: boolean): Promise<boolean> => {
  const brut = await AsyncStorage.getItem(cle);
  if (brut === null) return defaut;
  return brut === 'true';
};

const ecrireBool = (cle: string, valeur: boolean): Promise<void> =>
  AsyncStorage.setItem(cle, valeur ? 'true' : 'false');

export const getNotificationsActivees = () => lireBool(CLES.notifications, false);
export const setNotificationsActivees = (v: boolean) => ecrireBool(CLES.notifications, v);

export const getPenurieActivee = () => lireBool(CLES.penurie, false);
export const setPenurieActivee = (v: boolean) => ecrireBool(CLES.penurie, v);

export const getOnboardingVu = () => lireBool(CLES.onboardingVu, false);
export const setOnboardingVu = () => ecrireBool(CLES.onboardingVu, true);
