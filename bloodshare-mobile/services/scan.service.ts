import { USE_MOCK_DATA } from '../constants/config';
import api from './api';

export type BadgeDebloque = {
  id: number;
  nom: string;
};

export type CarteObtenue = {
  id: number;
  titre: string;
  categorie: string;
  // 📖 true = l'utilisateur possédait déjà cette carte. Le don est bien validé, mais aucune
  //    nouvelle carte-souvenir ni badge n'est accordé (cartes du mois uniques, don gratuit).
  deja_possedee: boolean;
  quantite?: number;
};

export type ResultatScan = {
  type: 'don' | 'evenement';
  carte_obtenue: CarteObtenue | null;
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
  if (USE_MOCK_DATA) {
    const dejaPossedee = tokensScannesMock.has(token);
    tokensScannesMock.add(token);

    return {
      type: 'don',
      carte_obtenue: {
        id: 108,
        titre: 'Août',
        categorie: 'mois_don',
        deja_possedee: dejaPossedee,
      },
      badges_debloques: dejaPossedee ? [] : [{ id: 1, nom: 'Premier don 🩸' }],
    };
  }

  const response = await api.post<ResultatScan>('/scan', { token });
  return response.data;
};
