import { USE_MOCK_DATA } from '../constants/config';
import cartesMock from '../data/mocks/cartes.json';
import api from './api';

export type CarteMois = {
  id: number;
  titre: string;
  mois_numero: number;
  image_url: string | null;
  obtenue: boolean;
  /** Saisie dans le BO ; absente d'un backend pas encore migré. */
  description?: string | null;
  /** Jour d'obtention (AAAA-MM-JJ), null tant que la carte n'est pas obtenue. */
  obtenue_le?: string | null;
};

export type CarteEvenementItem = {
  id: number;
  titre: string;
  image_url: string | null;
  obtenue: boolean;
  /** Saisie dans le BO ; absente d'un backend pas encore migré. */
  description?: string | null;
  /** Jour d'obtention (AAAA-MM-JJ), null tant que la carte n'est pas obtenue. */
  obtenue_le?: string | null;
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
  /** Saisie dans le BO ; absente d'un backend pas encore migré. */
  description?: string | null;
  /** Jour d'obtention (AAAA-MM-JJ), null tant que la carte n'est pas obtenue. */
  obtenue_le?: string | null;
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
  // Carte unique, même forme que les cartes Parrain / Filleul. null : carte absente ou désactivée.
  fidelite: {
    carte: CarteParrainage | null;
  };
};

// Cache mémoire simple : évite un nouvel appel réseau quand on navigue de
// l'écran Collections vers la grille des mois ou l'affichage d'une carte —
// ces écrans réutilisent les données déjà chargées au montage de Collections.
let cartesCache: Cartes | null = null;

export const getCartesCache = (): Cartes | null => cartesCache;

// Contrat réel de GET /cartes (docs/contrat_API.md § 5) : l'événement est une liste
// plate de cartes (la générique en premier, puis celles propres à un événement, ex.
// forum IUT), pas une liste de catégories.
type CartesApi = Omit<Cartes, 'evenement'> & {
  evenement: { cartes: CarteEvenementItem[] };
};

// Adaptateur : l'UI (et le mock) raisonnent en `categories` d'événements. On regroupe
// les cartes événement de l'API en une seule catégorie, pour que l'écran reste
// indépendant du contrat backend.
const adapterCartes = (data: CartesApi): Cartes => ({
  ...data,
  evenement: {
    categories: data.evenement.cartes.length
      ? [{ id: 'evenement', titre: 'Événements', cartes: data.evenement.cartes }]
      : [],
  },
});

export const getCartes = async (): Promise<Cartes> => {
  const data = USE_MOCK_DATA
    ? (cartesMock as Cartes)
    : adapterCartes((await api.get<CartesApi>('/cartes')).data);
  cartesCache = data;
  return data;
};
