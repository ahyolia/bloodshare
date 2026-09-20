import { USE_MOCK_DATA } from '../constants/config';
import badgesMock from '../data/mocks/badges.json';
import api from './api';

// 📖 L'écran Profil n'affiche qu'un compteur "obtenus / total". La galerie
//    détaillée vit dans l'onglet Cartes → on ne charge ici que le résumé.
export type BadgesResume = {
  obtenus: number;
  total: number;
};

// Contrat réel de GET /badges (docs/contrat_API.md § 6) : la liste de tous les badges, chacun
// avec un booléen `obtenu` — pas un résumé { obtenus, total }.
type BadgeApi = { id: number; nom: string; obtenu: boolean };

// Adaptateur : on calcule le résumé affiché par l'écran Profil à partir de la liste.
export const getBadgesResume = async (): Promise<BadgesResume> => {
  if (USE_MOCK_DATA) {
    return badgesMock as BadgesResume;
  }

  const response = await api.get<BadgeApi[]>('/badges');
  return {
    obtenus: response.data.filter((badge) => badge.obtenu).length,
    total: response.data.length,
  };
};
