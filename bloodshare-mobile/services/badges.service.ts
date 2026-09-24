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
export type Badge = {
  id: number;
  nom: string;
  image_url: string | null;
  obtenu: boolean;
  obtenu_at: string | null;
};

// Adaptateur : on calcule le résumé affiché par l'écran Profil à partir de la liste.
export const getBadgesResume = async (): Promise<BadgesResume> => {
  if (USE_MOCK_DATA) {
    return badgesMock as BadgesResume;
  }

  const badges = await getBadges();
  return {
    obtenus: badges.filter((badge) => badge.obtenu).length,
    total: badges.length,
  };
};

// 📖 Liste complète (écran "Mes badges") : contrairement au résumé ci-dessus, on a besoin
// ici de chaque badge (obtenu ou non) pour construire la grille avec ses cadenas.
export const getBadges = async (): Promise<Badge[]> => {
  if (USE_MOCK_DATA) {
    // Pas de mock dédié : le résumé suffisait jusqu'ici. On renvoie une liste vide plutôt
    // que de planter — l'écran affichera juste "0 badge" en mode démo.
    return [];
  }

  const response = await api.get<Badge[]>('/badges');
  return response.data;
};
