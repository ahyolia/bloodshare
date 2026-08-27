import { USE_MOCK_DATA } from '../constants/config';
import profilMock from '../data/mocks/profil.json';
import api from './api';

export type NiveauInfo = {
  niveau: number;
  label: string;
  points_actuels: number;
  points_prochain_niveau: number | null;
  progression: number;
};

export type Profil = {
  pseudo: string;
  points_cumules: number;
  niveau: NiveauInfo;
};

// Liste blanche explicite : GET /me renvoie aussi `sexe`, une donnée d'identité que
// CONTRIBUTING.md interdit de conserver. Tout champ non repris ici n'atteint pas les écrans.
const filtrerProfil = (profil: Profil): Profil => ({
  pseudo: profil.pseudo,
  points_cumules: profil.points_cumules,
  niveau: profil.niveau,
});

export const getProfil = async (): Promise<Profil> => {
  if (USE_MOCK_DATA) {
    return profilMock;
  }

  const response = await api.get<Profil>('/me');
  return filtrerProfil(response.data);
};
