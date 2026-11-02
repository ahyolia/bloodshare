import { USE_MOCK_DATA } from '../constants/config';
import badgesMock from '../data/mocks/badges.json';
import api from './api';
import { marquerNotificationLue } from './notifications.service';

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

/** Badge débloqué pas encore fêté (sa notification « badge débloqué » est non lue). */
export type BadgeAFeter = {
  notificationId: string;
  id: number;
  nom: string;
  image_url: string | null;
};

type BadgeAFeterApi = Omit<BadgeAFeter, 'notificationId'> & { notification_id: string };

// 📖 GET /badges/a-feter : quel que soit l'endroit où le badge a été gagné (scan, quiz,
//    parrainage d'un filleul, défi…), l'app le retrouve ici pour afficher le popup.
export const getBadgesAFeter = async (): Promise<BadgeAFeter[]> => {
  if (USE_MOCK_DATA) return [...badgesSimules];

  const response = await api.get<BadgeAFeterApi[]>('/badges/a-feter');
  const badges = response.data.map(({ notification_id, ...badge }) => ({ notificationId: notification_id, ...badge }));
  return [...badges, ...badgesSimules];
};

/** Le popup a été vu : sa notification passe en lue, il ne revient plus. */
export const marquerBadgeFete = async (badge: BadgeAFeter): Promise<void> => {
  const simule = badgesSimules.findIndex((b) => b.notificationId === badge.notificationId);
  if (simule >= 0) {
    badgesSimules.splice(simule, 1);
    return;
  }
  await marquerNotificationLue(badge.notificationId);
};

// 📖 Badges gagnés par un scan simulé (USE_MOCK_SCAN) : aucun serveur ne crée leur
//    notification, on les garde ici pour que le popup s'affiche quand même. Vide hors mock.
const badgesSimules: BadgeAFeter[] = [];

export const simulerBadgeAFeter = (badge: BadgeAFeter) => {
  badgesSimules.push(badge);
};
