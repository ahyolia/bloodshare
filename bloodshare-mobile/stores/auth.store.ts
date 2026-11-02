import { secureStorage } from '../services/storage/secureStorage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const saveToken = async (token: string) => {
  await secureStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await secureStorage.getItem(TOKEN_KEY);
};

export const removeToken = async () => {
  await secureStorage.removeItem(TOKEN_KEY);
  await secureStorage.removeItem(USER_KEY);
};

export const saveUser = async (user: object) => {
  await secureStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const raw = await secureStorage.getItem(USER_KEY);
  if (!raw) return null;

  // 📖 Le profil de donneur n'est plus collecté (donnée de santé). Les anciennes
  //    versions l'ont rangé ici : on l'écarte à la lecture, et comme chaque
  //    sauvegarde repart de getUser(), il disparaît du stockage au prochain saveUser.
  const user = JSON.parse(raw);
  delete user.statut_donneur;
  return user;
};