import { USE_MOCK_DATA } from '../constants/config';
import fichesInfosMock from '../data/mocks/fiches-infos.json';
import api from './api';

/** Quiz dont au moins une question renvoie vers la fiche (calculé par l'API). */
export type QuizLie = {
  id: number;
  titre: string;
};

export type FicheInfo = {
  id: number;
  titre: string;
  categorie: string;
  /** Texte saisi dans le BO : « ## Titre », « - » pour une puce, « **gras** » (voir TexteDocument). */
  contenu: string;
  quiz_lies?: QuizLie[];
  // Renseignés dans le backoffice (Contenus) ; `le_saviez_vous` vaut null quand il est vide.
  quiz_cta?: boolean;
  le_saviez_vous?: string | null;
};

export const getFichesInfos = async (): Promise<FicheInfo[]> => {
  if (USE_MOCK_DATA) {
    return fichesInfosMock;
  }

  const response = await api.get<FicheInfo[]>('/fiches-infos');
  return response.data;
};

export const getFicheInfo = async (id: number): Promise<FicheInfo | undefined> => {
  const fiches = await getFichesInfos();
  return fiches.find((fiche) => fiche.id === id);
};
