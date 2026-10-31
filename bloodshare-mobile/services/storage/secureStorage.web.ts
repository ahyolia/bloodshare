// Version web (PWA) : expo-secure-store n'existe pas dans le navigateur.
// localStorage est moins protégé (lisible en cas de faille XSS). Le token donne accès
// aux dates de don (données de santé) : il expire donc au bout de 90 jours côté serveur
// (config/sanctum.php), pour qu'un token volé ne reste pas valable indéfiniment.

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