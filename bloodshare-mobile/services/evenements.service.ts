import { USE_MOCK_DATA } from '../constants/config';
import evenementsMock from '../data/mocks/evenements.json';
import api from './api';

// 📖 Un événement organisé par l'association (collecte mobile, forum...).
//    `date_heure` : ISO 8601 avec fuseau (ex. "2026-07-02T09:00:00Z").
//    description / horaire_fin / image_url : absents du contrat API V1 minimal
//    (/evenements ne renvoie que id, titre, date_heure, lieu), mais le backoffice
//    peut les renseigner et l'écran détail les affiche s'ils sont présents.
export type Evenement = {
  id: number;
  titre: string;
  date_heure: string;
  lieu: string;
  description?: string | null;
  horaire_fin?: string | null;
  image_url?: string | null;
};

// 📖 Adaptateur. Deux traitements « métier » ici (pas dans l'écran, comme
//    GROUPES_SANGUINS) :
//    - filet de sécurité : on ne garde que les événements À VENIR. Le contrat dit
//      que l'API filtre déjà, mais on refiltre pour les mocks / si un événement
//      « passe » dans le passé pendant la session.
//    - tri par date croissante → l'écran affiche simplement les 3 premiers.
export const getEvenements = async (): Promise<Evenement[]> => {
  const data: Evenement[] = USE_MOCK_DATA
    ? (evenementsMock as Evenement[])
    : (await api.get<Evenement[]>('/evenements')).data;

  const maintenant = Date.now();
  return data
    .filter((e) => new Date(e.date_heure).getTime() >= maintenant)
    .sort((a, b) => new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime());
};
