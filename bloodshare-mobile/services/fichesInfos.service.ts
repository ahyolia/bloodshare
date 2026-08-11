import { USE_MOCK_DATA } from '../constants/config';
import fichesInfosMock from '../data/mocks/fiches-infos.json';
import api from './api';

export type FicheInfo = {
  id: number;
  titre: string;
  categorie: string;
  contenu: string;
};

export const getFichesInfos = async (): Promise<FicheInfo[]> => {
  if (USE_MOCK_DATA) {
    return fichesInfosMock;
  }

  const response = await api.get<FicheInfo[]>('/fiches-infos');
  return response.data;
};

export const getFicheInfo = async (id: number): Promise<FicheInfo | undefined> => {
  const fiches = await getFichesInfos();
  return fiches.find((fiche) => fiche.id === id);
};
