import { USE_MOCK_DATA } from '../constants/config';
import defiActuelMock from '../data/mocks/defis-actuel.json';
import api from './api';

// 📖 Défi COLLECTIF du mois : un objectif chiffré commun (ex. 500 dons) et une
//    progression agrégée. Pas de donnée individuelle → compatible anonymat.
export type DefiActuel = {
  titre: string;
  progression_actuelle: number;
  objectif_chiffre: number;
};

// 📖 Peut ne rien renvoyer (aucun défi en cours) → `null`. L'écran masque alors
//    toute la section. Côté API, un 204 / un corps vide est traité comme `null`.
export const getDefiActuel = async (): Promise<DefiActuel | null> => {
  if (USE_MOCK_DATA) {
    return defiActuelMock as DefiActuel;
  }

  const response = await api.get<DefiActuel | ''>('/defis/actuel');
  return response.data ? (response.data as DefiActuel) : null;
};
