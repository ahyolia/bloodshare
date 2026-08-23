import { USE_MOCK_DATA } from '../constants/config';
import profilMock from '../data/mocks/profil.json';
import api from './api';

export type Profil = {
  points_cumules: number;
};

export const getProfil = async (): Promise<Profil> => {
  if (USE_MOCK_DATA) {
    return profilMock;
  }

  const response = await api.get<Profil>('/me');
  return response.data;
};
