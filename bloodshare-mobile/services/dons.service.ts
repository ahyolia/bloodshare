import { USE_MOCK_DATA } from '../constants/config';
import donsMock from '../data/mocks/dons.json';
import api from './api';

// 📖 Un don peut venir d'un centre de collecte ou d'un événement : deux visuels
//    (pilule corail vs pétrole) pilotés par ce champ.
export type TypeDon = 'don' | 'evenement';

export type Don = {
  id: number;
  date_don: string; // ISO 8601, formaté à l'affichage via toLocaleDateString
  type: TypeDon;
  // 📖 Nullable : un don peut ne pas (encore) avoir de carte associée.
  carte_obtenue: { id: number; titre: string } | null;
};

export type DonsReponse = {
  total_dons: number;
  dons: Don[];
};

export const getDons = async (): Promise<DonsReponse> => {
  if (USE_MOCK_DATA) {
    return donsMock as DonsReponse;
  }

  const response = await api.get<DonsReponse>('/dons');
  return response.data;
};
