import { USE_MOCK_DATA } from '../constants/config';
import donsMock from '../data/mocks/dons.json';
import api from './api';

// 📖 Un don peut venir d'un centre de collecte ou d'un événement : deux visuels
//    (pilule corail vs pétrole) pilotés par ce champ.
export type TypeDon = 'don' | 'evenement';

export type Don = {
  id: number;
  date_don: string; // ISO 8601, formaté à l'affichage via toLocaleDateString
  type: TypeDon;
  // 📖 Nullable : un don peut ne pas (encore) avoir de carte associée.
  carte_obtenue: { id: number; titre: string } | null;
};

export type DonsReponse = {
  total_dons: number;
  dons: Don[];
};

// Contrat réel de GET /dons (docs/contrat_API.md § 4) : la liste est sous la clé `data`
// et le type d'un don est l'origine du QR Code scanné ("centre" ou "evenement"),
// pas "don" comme dans le mock.
type DonsApi = {
  total_dons: number;
  data: (Omit<Don, 'type'> & { type: 'centre' | 'evenement' | null })[];
};

// Adaptateur : l'UI (et le mock) raisonnent en `dons` avec type 'don' | 'evenement'.
// On convertit ici pour que les écrans restent indépendants du contrat backend.
const adapterDons = (data: DonsApi): DonsReponse => ({
  total_dons: data.total_dons,
  dons: data.data.map((don) => ({
    ...don,
    type: don.type === 'evenement' ? 'evenement' : 'don',
  })),
});

export const getDons = async (): Promise<DonsReponse> => {
  if (USE_MOCK_DATA) {
    return donsMock as DonsReponse;
  }

  const response = await api.get<DonsApi>('/dons');
  return adapterDons(response.data);
};
