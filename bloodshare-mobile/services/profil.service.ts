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
  avatar_id: number | null;
  avatar_url: string | null;
  points_cumules: number;
  niveau: NiveauInfo;
  code_parrainage: string;
  nb_parrainages_valides: number;
};

// 📖 Payload envoyé par l'écran "Informations personnelles". Volontairement
//    restreint aux 2 champs modifiables : on n'expose jamais points/niveau à
//    l'écriture côté client.
export type MajProfilPayload = {
  pseudo: string;
  avatar_id: number | null;
};

// 📖 Catalogue local des avatars : des emojis « nature et objets », neutres (ni
//    visage, ni genre) pour respecter l'anonymat. Pas d'appel réseau : l'API ne
//    transmet que `avatar_id`, l'app en déduit l'emoji. Chaque id doit exister
//    dans la table `avatars` (AvatarSeeder), sinon PUT /me refuse le choix.
//    `nom` sert de libellé aux lecteurs d'écran.
export type Avatar = { id: number; emoji: string; nom: string };

export const AVATARS: Avatar[] = [
  { id: 1, emoji: '🌸', nom: 'Fleur de cerisier' },
  { id: 2, emoji: '🌻', nom: 'Tournesol' },
  { id: 3, emoji: '🍀', nom: 'Trèfle' },
  { id: 4, emoji: '🌈', nom: 'Arc-en-ciel' },
  { id: 5, emoji: '⭐', nom: 'Étoile' },
  { id: 6, emoji: '🌙', nom: 'Lune' },
  { id: 7, emoji: '🔥', nom: 'Flamme' },
  { id: 8, emoji: '💧', nom: 'Goutte' },
];

/** Avatar correspondant à un `avatar_id`, ou `undefined` (aucun, ou id inconnu de l'app). */
export const avatarParId = (id: number | null | undefined): Avatar | undefined =>
  AVATARS.find((a) => a.id === id);

// Liste blanche explicite : GET /me renvoie aussi `sexe`, une donnée d'identité que
// CONTRIBUTING.md interdit de conserver. Tout champ non repris ici n'atteint pas les écrans.
const filtrerProfil = (profil: Profil): Profil => ({
  pseudo: profil.pseudo,
  avatar_id: profil.avatar_id,
  avatar_url: profil.avatar_url,
  points_cumules: profil.points_cumules,
  niveau: profil.niveau,
  code_parrainage: profil.code_parrainage,
  // Absent des réponses de PUT /me : on retombe sur 0 plutôt que sur `undefined`.
  nb_parrainages_valides: profil.nb_parrainages_valides ?? 0,
});

// Un échec ici ne doit jamais empêcher d'afficher le profil : le compteur retombe à 0.
const getNbParrainagesValides = async (): Promise<number> => {
  try {
    const response = await api.get<{ code: string; nb_parrainages_valides: number }>(
      '/parrainage/code'
    );
    return response.data.nb_parrainages_valides ?? 0;
  } catch {
    return 0;
  }
};

export const getProfil = async (): Promise<Profil> => {
  if (USE_MOCK_DATA) {
    return profilMock as Profil;
  }

  // GET /me ne contient pas le nombre de parrainages validés (docs/contrat_API.md) : il vient
  // de GET /parrainage/code, appelé en parallèle.
  const [response, nbParrainagesValides] = await Promise.all([
    api.get<Profil>('/me'),
    getNbParrainagesValides(),
  ]);
  return filtrerProfil({ ...response.data, nb_parrainages_valides: nbParrainagesValides });
};

// 📖 PUT /me : met à jour pseudo + avatar, puis renvoie le profil frais
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
