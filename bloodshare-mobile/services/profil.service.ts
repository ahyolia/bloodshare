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

// 📖 Trois valeurs seulement, alignées sur l'enum du backend. On type l'union
//    plutôt qu'un `string` libre : le compilateur refuse alors toute faute de
//    frappe ('donneur_reguler') et les `switch` de traduction sont exhaustifs.
export type StatutDonneur = 'donneur_regulier' | 'quelques_dons' | 'jamais_donne';

export type Profil = {
  pseudo: string;
  statut_donneur: StatutDonneur | null;
  avatar_id: number | null;
  avatar_url: string | null;
  points_cumules: number;
  niveau: NiveauInfo;
  code_parrainage: string;
  nb_parrainages_valides: number;
};

// 📖 Payload envoyé par l'écran "Informations personnelles". Volontairement
//    restreint aux 3 champs modifiables : on n'expose jamais points/niveau à
//    l'écriture côté client.
export type MajProfilPayload = {
  pseudo: string;
  avatar_id: number | null;
  statut_donneur: StatutDonneur;
};

// 📖 Catalogue local des 5 avatars proposés. Pas d'appel réseau : ce sont des
//    assets figés de l'app. `image_url: null` → l'UI retombe sur l'initiale du
//    pseudo (même logique que l'AppHeader).
export const AVATARS: { id: number; image_url: string | null }[] = [
  { id: 1, image_url: null },
  { id: 2, image_url: null },
  { id: 3, image_url: null },
  { id: 4, image_url: null },
  { id: 5, image_url: null },
];

// Liste blanche explicite : GET /me renvoie aussi `sexe`, une donnée d'identité que
// CONTRIBUTING.md interdit de conserver. Tout champ non repris ici n'atteint pas les écrans.
const filtrerProfil = (profil: Profil): Profil => ({
  pseudo: profil.pseudo,
  statut_donneur: profil.statut_donneur,
  avatar_id: profil.avatar_id,
  avatar_url: profil.avatar_url,
  points_cumules: profil.points_cumules,
  niveau: profil.niveau,
  code_parrainage: profil.code_parrainage,
  nb_parrainages_valides: profil.nb_parrainages_valides,
});

export const getProfil = async (): Promise<Profil> => {
  if (USE_MOCK_DATA) {
    return profilMock as Profil;
  }

  const response = await api.get<Profil>('/me');
  return filtrerProfil(response.data);
};

// 📖 PUT /me : met à jour pseudo + avatar + statut, puis renvoie le profil frais
//    (déjà refiltré) pour que l'appelant le range dans le SecureStore.
export const updateProfil = async (payload: MajProfilPayload): Promise<Profil> => {
  if (USE_MOCK_DATA) {
    return { ...(profilMock as Profil), ...payload };
  }

  const response = await api.put<Profil>('/me', payload);
  return filtrerProfil(response.data);
};

// 📖 DELETE /me : suppression définitive du compte. Aucun retour utile → Promise<void>.
export const supprimerCompte = async (): Promise<void> => {
  if (USE_MOCK_DATA) {
    return;
  }

  await api.delete('/me');
};
