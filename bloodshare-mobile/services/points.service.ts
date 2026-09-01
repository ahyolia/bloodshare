import { USE_MOCK_DATA } from '../constants/config';
import pointsHistoriqueMock from '../data/mocks/points-historique.json';
import api from './api';

// 📖 Trois sources de points possibles. Union typée → le mapping icône + libellé
//    est vérifié exhaustivement par le compilateur.
export type SourcePoints = 'quiz' | 'parrainage' | 'defi';

export type GainPoints = {
  id: number;
  source: SourcePoints;
  points: number;
  date: string; // ISO 8601
};

export const getPointsHistorique = async (): Promise<GainPoints[]> => {
  if (USE_MOCK_DATA) {
    return pointsHistoriqueMock as GainPoints[];
  }

  const response = await api.get<GainPoints[]>('/points/historique');
  return response.data;
};
