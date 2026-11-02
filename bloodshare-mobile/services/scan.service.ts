import { USE_MOCK_DATA, USE_MOCK_SCAN } from '../constants/config';
import api from './api';
import { simulerBadgeAFeter } from './badges.service';
import { getCartesCache } from './cartes.service';

export type BadgeDebloque = {
  id: number;
  nom: string;
};

export type CarteObtenue = {
  id: number;
  titre: string;
  categorie: string;
  image_url?: string | null;
  // Carte du mois uniquement : le numéro du mois (1 à 12).
  mois_numero?: number | null;
  // Carte du mois uniquement : sa collection (année).
  annee?: number | null;
  // 📖 true = l'utilisateur possédait déjà cette carte. Le don est bien validé, mais aucune
  //    nouvelle carte-souvenir ni badge n'est accordé (cartes du mois uniques, don gratuit).
  deja_possedee: boolean;
  quantite?: number;
};

export type ResultatScan = {
  type: 'don' | 'evenement';
  carte_obtenue: CarteObtenue | null;
  // 📖 Don uniquement : la carte Fidèle, obtenue EN PLUS de la carte du mois au premier don
  //    validé un an après le tout premier. Absente ou null le reste du temps.
  carte_fidele?: { id: number; titre: string; categorie: string; image_url?: string | null } | null;
  badges_debloques: BadgeDebloque[];
};

// 📖 Mémoire de session (mock uniquement) : permet de simuler un 2e scan du même QR Code
//    → carte déjà possédée, pas de nouveau badge. Réinitialisé au redémarrage de l'app.
const tokensScannesMock = new Set<string>();

/**
 * 📖 Soumet le contenu d'un QR Code au backend, qui seul sait le valider (don réel,
 * éligibilité, expiration...). En mode mock, on renvoie un succès plausible pour pouvoir
 * dérouler le parcours scan → résultat sans backend joignable.
 */
export const soumettreScan = async (token: string): Promise<ResultatScan> => {
  if (USE_MOCK_DATA || USE_MOCK_SCAN) {
    const dejaPossedee = tokensScannesMock.has(token);
    tokensScannesMock.add(token);
    // Une vraie carte du mois de la collection déjà chargée, de préférence illustrée, pour
    // voir l'animation avec son dessin ; sinon la carte d'août sans visuel.
    const cartesMois = getCartesCache()?.mois_don.cartes ?? [];
    const carte = cartesMois.find((c) => c.image_url) ?? cartesMois[0];
    // Le popup de badge passe par les « badges à fêter » : on en simule un, comme le serveur.
    if (!dejaPossedee) {
      simulerBadgeAFeter({ notificationId: `mock-${token}`, id: 1, nom: 'Premier don', image_url: null });
    }

    return {
      type: 'don',
      carte_obtenue: {
        id: carte?.id ?? 108,
        titre: carte?.titre ?? 'Août',
        categorie: 'mois_don',
        image_url: carte?.image_url ?? null,
        mois_numero: carte?.mois_numero ?? 8,
        deja_possedee: dejaPossedee,
      },
      badges_debloques: dejaPossedee ? [] : [{ id: 1, nom: 'Premier don' }],
    };
  }

  const response = await api.post<ResultatScan>('/scan', { token });
  return response.data;
};
