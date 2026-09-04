import { USE_MOCK_DATA } from '../constants/config';
import actualitesMock from '../data/mocks/actualites.json';
import api from './api';

// 📖 Une actualité = une brève éditoriale affichée dans le carousel de l'accueil.
//    Contenu 100 % éditorial (association), aucune donnée personnelle → compatible
//    anonymat. `image_url` peut être null (le carousel affiche alors un placeholder).
export type Actualite = {
  id: number;
  titre: string;
  image_url: string | null;
  published_at: string; // date ISO "2026-06-01"
};

// 📖 Adaptateur : l'écran ne connaît que cette fonction, jamais l'URL ni axios.
//    En mode maquette (USE_MOCK_DATA), on renvoie le JSON local ; sinon l'API.
export const getActualites = async (): Promise<Actualite[]> => {
  if (USE_MOCK_DATA) {
    return actualitesMock as Actualite[];
  }

  const response = await api.get<Actualite[]>('/actualites');
  return response.data;
};
