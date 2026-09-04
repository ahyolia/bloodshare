import { USE_MOCK_DATA } from '../constants/config';
import banniereMock from '../data/mocks/bannieres.json';
import api from './api';

// 📖 Trois niveaux d'urgence → pilotent l'icône, le fond et la bordure de la carte.
export type TypeBanniere = 'info' | 'alerte' | 'urgence';

export type Banniere = {
  active: boolean;
  type: TypeBanniere;
  titre: string;
  message: string;
};

// 📖 Le backoffice n'expose qu'une bannière courante (activable/désactivable).
//    `active: false` → l'écran ne rend rien. On renvoie l'objet tel quel plutôt
//    qu'un `null` pour garder le champ `type`/`titre` dispo pour d'éventuels
//    aperçus BO ; c'est l'écran qui décide de masquer.
export const getBanniere = async (): Promise<Banniere> => {
  if (USE_MOCK_DATA) {
    return banniereMock as Banniere;
  }

  const response = await api.get<Banniere>('/bannieres');
  return response.data;
};
