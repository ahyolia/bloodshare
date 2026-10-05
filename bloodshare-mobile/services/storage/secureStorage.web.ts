// Version web (PWA) : expo-secure-store n'existe pas dans le navigateur.
// localStorage est moins protégé (lisible en cas de faille XSS) : compromis
// accepté car le token ne donne accès qu'à la gamification, sans donnée d'identité.

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const secureStorage = {
  getItem: async (key: string) => (hasStorage() ? localStorage.getItem(key) : null),
  setItem: async (key: string, value: string) => {
    if (hasStorage()) localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (hasStorage()) localStorage.removeItem(key);
  },
};