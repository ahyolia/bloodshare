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

// Contrat réel de GET /points/historique (docs/contrat_API.md § 7) : un objet
// { points_cumules, historique: [{ points, source, created_at }] }, sans `id`.
type HistoriquePointsApi = {
  points_cumules: number;
  historique: { points: number; source: SourcePoints; created_at: string }[];
};

// Adaptateur : l'UI (et le mock) attendent un tableau de { id, source, points, date }.
// L'API ne fournit pas d'id : la liste est triée du plus récent au plus ancien, l'index
// sert donc de clé stable pour la FlatList.
export const getPointsHistorique = async (): Promise<GainPoints[]> => {
  if (USE_MOCK_DATA) {
    return pointsHistoriqueMock as GainPoints[];
  }

  const response = await api.get<HistoriquePointsApi>('/points/historique');
  return response.data.historique.map((gain, index) => ({
    id: index,
    source: gain.source,
    points: gain.points,
    date: gain.created_at,
  }));
};
