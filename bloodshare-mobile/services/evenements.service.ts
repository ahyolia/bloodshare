import { USE_MOCK_DATA } from '../constants/config';
import evenementsMock from '../data/mocks/evenements.json';
import api from './api';

// 📖 Un événement organisé par l'association (collecte mobile, forum...).
//    `date_heure` : ISO 8601 avec fuseau (ex. "2026-07-02T09:00:00Z").
//    description / horaire_fin / image_url sont optionnels côté backoffice
//    (peuvent rester vides) : l'écran détail les affiche s'ils sont présents.
export type Evenement = {
  id: number;
  titre: string;
  date_heure: string;
  lieu: string;
  description?: string | null;
  horaire_fin?: string | null;
  image_url?: string | null;
};

// 📖 Nouméa est à UTC+11 toute l'année (pas d'heure d'été).
const DECALAGE_NOUMEA_MS = 11 * 3_600_000;

/** Fin d'un événement (ms) : son heure de fin, sinon minuit à la fin de son jour à Nouméa. */
export function finEvenement(e: Pick<Evenement, 'date_heure' | 'horaire_fin'>): number {
  if (e.horaire_fin) return new Date(e.horaire_fin).getTime();
  const jour = new Date(new Date(e.date_heure).getTime() + DECALAGE_NOUMEA_MS);
  return Date.UTC(jour.getUTCFullYear(), jour.getUTCMonth(), jour.getUTCDate() + 1) - DECALAGE_NOUMEA_MS;
}

// 📖 Adaptateur. Deux traitements « métier » ici (pas dans l'écran, comme
//    GROUPES_SANGUINS) :
//    - filet de sécurité : on ne garde que les événements PAS ENCORE TERMINÉS. Le
//      contrat dit que l'API filtre déjà, mais on refiltre pour les mocks / si un
//      événement se termine pendant la session. Un événement commencé reste affiché
//      jusqu'à sa fin (horaire_fin, ou la fin de son jour sans heure de fin) : filtré
//      sur son début, le Forum disparaissait de l'accueil en plein pendant.
//    - tri par date croissante → l'écran affiche simplement les 3 premiers.
export const getEvenements = async (): Promise<Evenement[]> => {
  const data: Evenement[] = USE_MOCK_DATA
    ? (evenementsMock as Evenement[])
    : (await api.get<Evenement[]>('/evenements')).data;

  const maintenant = Date.now();
  return data
    .filter((e) => finEvenement(e) >= maintenant)
    .sort((a, b) => new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime());
};
