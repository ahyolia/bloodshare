import { USE_MOCK_DATA } from '../constants/config';
import cartesMock from '../data/mocks/cartes.json';
import api from './api';

export type CarteMois = {
  id: number;
  titre: string;
  mois_numero: number;
  /** Collection de la carte ; absente d'un backend pas encore migré. */
  annee?: number;
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

/** Les 12 cartes de mois d'une année. */
export type CollectionMois = {
  annee: number;
  pourcentage_complete: number;
  cartes: CarteMois[];
};

export type Cartes = {
  mois_don: {
    /** Année en cours : sa collection est aussi dans `cartes` et `pourcentage_complete`. */
    annee: number;
    pourcentage_complete: number;
    cartes: CarteMois[];
    /** L'année en cours et les années passées où le donneur a une carte, la plus récente d'abord. */
    collections: CollectionMois[];
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
type MoisDonApi = Pick<Cartes['mois_don'], 'pourcentage_complete' | 'cartes'> &
  Partial<Pick<Cartes['mois_don'], 'annee' | 'collections'>>;

// 📖 `cartes` absent : backend pas encore à jour, qui ne renvoyait que la carte
//    générique (`carte`, nullable). L'app peut être publiée avant lui.
type CartesApi = Omit<Cartes, 'evenement' | 'mois_don'> & {
  mois_don: MoisDonApi;
  evenement: { cartes?: CarteEvenementItem[]; carte?: CarteEvenementItem | null };
};

const cartesEvenementApi = ({ cartes, carte }: CartesApi['evenement']): CarteEvenementItem[] =>
  cartes ?? (carte ? [carte] : []);

// 📖 Un backend sans collections par année (ou le mock) ne renvoie que la collection de
//    l'année : on en fait une liste d'une seule collection, pour que l'écran n'ait qu'un cas.
const adapterMois = (mois: MoisDonApi): Cartes['mois_don'] => {
  const annee = mois.annee ?? new Date().getFullYear();
  return {
    ...mois,
    annee,
    collections: mois.collections?.length
      ? mois.collections
      : [{ annee, pourcentage_complete: mois.pourcentage_complete, cartes: mois.cartes }],
  };
};

// Adaptateur : l'UI (et le mock) raisonnent en `categories` d'événements. On regroupe
// les cartes événement de l'API en une seule catégorie, pour que l'écran reste
// indépendant du contrat backend.
const adapterCartes = (data: CartesApi): Cartes => {
  const cartesEvenement = cartesEvenementApi(data.evenement);
  return {
    ...data,
    mois_don: adapterMois(data.mois_don),
    evenement: {
      categories: cartesEvenement.length
        ? [{ id: 'evenement', titre: 'Événements', cartes: cartesEvenement }]
        : [],
    },
  };
};

type CartesMock = Omit<Cartes, 'mois_don'> & { mois_don: MoisDonApi };

export const getCartes = async (): Promise<Cartes> => {
  const data = USE_MOCK_DATA
    ? { ...(cartesMock as CartesMock), mois_don: adapterMois((cartesMock as CartesMock).mois_don) }
    : adapterCartes((await api.get<CartesApi>('/cartes')).data);
  cartesCache = data;
  return data;
};
