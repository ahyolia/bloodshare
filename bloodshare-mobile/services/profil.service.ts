import { USE_MOCK_DATA } from '../constants/config';
import profilMock from '../data/mocks/profil.json';
import api from './api';

export type NiveauInfo = {
  niveau: number;
  label: string;
  points_actuels: number;
  points_prochain_niveau: number | null;
  progression: number;
};

export type Profil = {
  pseudo: string;
  points_cumules: number;
  niveau: NiveauInfo;
};

export const getProfil = async (): Promise<Profil> => {
  if (USE_MOCK_DATA) {
    return profilMock as Profil;
  }

  const response = await api.get<Profil>('/me');
  return response.data;
};
