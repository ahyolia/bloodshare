import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { avecEspacesInsecables } from '../utils/typographie';
import type { TeintePastille } from './teintes';

type Apparence = { icone: ComponentProps<typeof Ionicons>['name']; teinte: TeintePastille };

// 📖 Icône et teinte de chaque catégorie de quiz, sur les tuiles et les lignes.
//    Mêmes libellés que le backoffice (QuizResource, QuizContenuSeeder).
const CATEGORIES: Record<string, Apparence> = {
  // Le don du sang prend le corail (rouge de la marque), la goutte de sang lui va.
  'Qui peut donner ?': { icone: 'people-outline', teinte: 'petrole' },
  'Le don du sang': { icone: 'water-outline', teinte: 'corail' },
  "Le Centre et l'ADSB-NC": { icone: 'business-outline', teinte: 'mousse' },
};

// Catégorie inconnue (saisie hors liste) : apparence neutre plutôt qu'une tuile cassée.
const PAR_DEFAUT: Apparence = { icone: 'bulb-outline', teinte: 'orange' };

// 📖 Les libellés ci-dessus et ceux reçus de l'API ont l'espace insécable avant « ? »
//    (utils/typographie) : on normalise pour que la recherche marche dans tous les cas.
export const apparenceCategorie = (categorie: string): Apparence =>
  CATEGORIES[avecEspacesInsecables(categorie)] ?? PAR_DEFAUT;
