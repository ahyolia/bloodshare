import { USE_MOCK_DATA } from '../constants/config';
import authMock from '../data/mocks/auth.json';
import api from './api';

// Format renvoyé par POST /auth/login et POST /auth/register (voir docs/contrat_API.md § 1).
// ⚠️ Contrainte anonymat (CONTRIBUTING.md) : `groupe_sanguin` est renvoyé par l'API mais
// n'est volontairement PAS repris ici, ni stocké sur le téléphone.
export type Utilisateur = {
  id: number;
  pseudo: string;
  avatar_url: string | null;
  points_cumules: number;
  code_parrainage: string;
};

export type AuthResponse = {
  token: string;
  user: Utilisateur;
};

// Ne conserve que les champs autorisés : ce que l'API renvoie en plus est écarté ici,
// avant tout stockage (le SecureStore ne doit jamais contenir de donnée médicale).
const filtrerUtilisateur = (user: Utilisateur): Utilisateur => ({
  id: user.id,
  pseudo: user.pseudo,
  avatar_url: user.avatar_url,
  points_cumules: user.points_cumules,
  code_parrainage: user.code_parrainage,
});

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  if (USE_MOCK_DATA) {
    return authMock;
  }

  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return { token: response.data.token, user: filtrerUtilisateur(response.data.user) };
};

export const logout = async (): Promise<void> => {
  if (USE_MOCK_DATA) {
    return;
  }

  await api.post('/auth/logout');
};

export const forgotPassword = async (email: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    return;
  }

  await api.post('/auth/forgot-password', { email });
};
