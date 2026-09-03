import { USE_MOCK_DATA } from '../constants/config';
import badgesMock from '../data/mocks/badges.json';
import api from './api';

// 📖 L'écran Profil n'affiche qu'un compteur "obtenus / total". La galerie
//    détaillée vit dans l'onglet Cartes → on ne charge ici que le résumé.
export type BadgesResume = {
  obtenus: number;
  total: number;
};

export const getBadgesResume = async (): Promise<BadgesResume> => {
  if (USE_MOCK_DATA) {
    return badgesMock as BadgesResume;
  }

  const response = await api.get<BadgesResume>('/badges');
  return response.data;
};
