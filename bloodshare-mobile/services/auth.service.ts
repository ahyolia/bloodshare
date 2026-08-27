import { USE_MOCK_DATA } from '../constants/config';
import authMock from '../data/mocks/auth.json';
import api from './api';

// Format réellement renvoyé par POST /auth/login (AuthController::formatUser).
// ⚠️ docs/contrat_API.md § 1 est périmé sur ce point : il documente encore un
// `groupe_sanguin`, supprimé de la table `users` par la migration du 17/07/2026.
export type Utilisateur = {
  id: number;
  pseudo: string;
  avatar_url: string | null;
  statut_donneur: string | null;
  points_cumules: number;
  code_parrainage: string;
};

export type AuthResponse = {
  token: string;
  user: Utilisateur;
};

// Liste blanche explicite : tout champ ajouté à la réponse API sans être repris ici
// n'atteindra pas le SecureStore. Garde-fou volontaire pour la contrainte d'anonymat
// (CONTRIBUTING.md) — aucune donnée médicale ni d'identité réelle stockée.
const filtrerUtilisateur = (user: Utilisateur): Utilisateur => ({
  id: user.id,
  pseudo: user.pseudo,
  avatar_url: user.avatar_url,
  statut_donneur: user.statut_donneur,
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
