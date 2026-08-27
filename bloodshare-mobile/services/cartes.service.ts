import { USE_MOCK_DATA } from '../constants/config';
import cartesMock from '../data/mocks/cartes.json';
import api from './api';

export type CarteMois = {
  id: number;
  titre: string;
  mois_numero: number;
  image_url: string | null;
  obtenue: boolean;
};

export type CarteEvenementItem = {
  id: number;
  titre: string;
  image_url: string | null;
  obtenue: boolean;
  quantite?: number;
};

export type CategorieEvenement = {
  id: string;
  titre: string;
  cartes: CarteEvenementItem[];
};

export type CarteParrainage = {
  id: number;
  titre: string;
  image_url: string | null;
  obtenue: boolean;
  quantite?: number;
};

export type Cartes = {
  mois_don: {
    pourcentage_complete: number;
    cartes: CarteMois[];
  };
  evenement: {
    categories: CategorieEvenement[];
  };
  parrainage: {
    carte_parrain: CarteParrainage;
    carte_filleul: CarteParrainage;
  };
};

// Cache mémoire simple : évite un nouvel appel réseau quand on navigue de
// l'écran Collections vers la grille des mois ou l'affichage d'une carte —
// ces écrans réutilisent les données déjà chargées au montage de Collections.
let cartesCache: Cartes | null = null;

export const getCartesCache = (): Cartes | null => cartesCache;

export const getCartes = async (): Promise<Cartes> => {
  const data = USE_MOCK_DATA ? (cartesMock as Cartes) : (await api.get<Cartes>('/cartes')).data;
  cartesCache = data;
  return data;
};
