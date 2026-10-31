import * as SecureStore from 'expo-secure-store';

// Version iOS / Android : stockage chiffré (Keychain / Keystore).
export const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};