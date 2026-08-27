import { USE_MOCK_DATA } from '../constants/config';
import profilMock from '../data/mocks/profil.json';
import api from './api';

// Format renvoyé par GET /me (voir docs/contrat_API.md § 2).
// ⚠️ Contrainte anonymat (CONTRIBUTING.md) : `groupe_sanguin` et `sexe` sont renvoyés par
// l'API mais ne sont volontairement pas repris ici, ni affichés, ni stockés.
export type Profil = {
  id: number;
  pseudo: string;
  avatar_url: string | null;
  points_cumules: number;
  code_parrainage: string;
  statut: string;
};

// Ne conserve que les champs autorisés : ce que l'API renvoie en plus est écarté ici.
const filtrerProfil = (profil: Profil): Profil => ({
  id: profil.id,
  pseudo: profil.pseudo,
  avatar_url: profil.avatar_url,
  points_cumules: profil.points_cumules,
  code_parrainage: profil.code_parrainage,
  statut: profil.statut,
});

export const getProfil = async (): Promise<Profil> => {
  if (USE_MOCK_DATA) {
    return profilMock;
  }

  const response = await api.get<Profil>('/me');
  return filtrerProfil(response.data);
};
