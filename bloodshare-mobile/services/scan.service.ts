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
};

export type ResultatScan = {
  type: 'don' | 'evenement';
  carte_obtenue: CarteObtenue | null;
  badges_debloques: BadgeDebloque[];
};

/**
 * 📖 Soumet le contenu d'un QR Code au backend, qui seul sait le valider (don réel,
 * éligibilité, expiration...). En mode mock, on renvoie un succès plausible pour pouvoir
 * dérouler le parcours scan → résultat sans backend joignable.
 */
export const soumettreScan = async (token: string): Promise<ResultatScan> => {
  if (USE_MOCK_DATA) {
    return {
      type: 'don',
      carte_obtenue: { id: 108, titre: 'Août', categorie: 'mois_don' },
      badges_debloques: [{ id: 1, nom: 'Premier don 🩸' }],
    };
  }

  const response = await api.post<ResultatScan>('/scan', { token });
  return response.data;
};
