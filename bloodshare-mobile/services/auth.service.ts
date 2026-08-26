import { USE_MOCK_DATA } from '../constants/config';
import authMock from '../data/mocks/auth.json';
import api from './api';

// Format renvoyé par POST /auth/login et POST /auth/register (voir docs/contrat_API.md § 1)
export type Utilisateur = {
  id: number;
  pseudo: string;
  avatar_url: string | null;
  groupe_sanguin: string;
  points_cumules: number;
  code_parrainage: string;
};

export type AuthResponse = {
  token: string;
  user: Utilisateur;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  if (USE_MOCK_DATA) {
    return authMock;
  }

  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
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
