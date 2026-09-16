import { USE_MOCK_DATA } from '../constants/config';
import stockSangMock from '../data/mocks/stock-sang.json';
import api from './api';

// 📖 Quatre paliers seulement, alignés sur l'enum backend et sur Colors.status.
//    `null` = le centre n'a pas communiqué de niveau pour ce groupe → affiché en gris.
export type NiveauStock = 'critique' | 'bas' | 'correct' | 'bon';

export type StockGroupe = {
  groupe: string; // "O-", "O+", "A-", ...
  niveau: NiveauStock | null;
};

// 📖 Les 8 groupes sanguins dans l'ordre d'affichage du carousel. Constante ici
//    (pas dans l'écran) : c'est une donnée métier, pas une préférence de rendu.
export const GROUPES_SANGUINS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

// 📖 Données GLOBALES du centre de collecte : aucun lien avec le profil médical
//    de l'utilisateur (cf. contrainte anonymat). Pas de token requis côté métier.
export const getStockSang = async (): Promise<StockGroupe[]> => {
  if (USE_MOCK_DATA) {
    return stockSangMock as StockGroupe[];
  }

  const response = await api.get<StockGroupe[]>('/stock-sang');
  return response.data;
};
