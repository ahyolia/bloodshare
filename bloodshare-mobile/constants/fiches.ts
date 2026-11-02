import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { TeintePastille } from './teintes';

export type CategorieFiche = {
  cle: string;
  libelle: string;
  /** Libellé court, pour les pastilles de filtre. */
  court: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  /** Version pleine de l'icône, en grand derrière les cartes de fiche. */
  iconePleine: ComponentProps<typeof Ionicons>['name'];
  teinte: TeintePastille;
};

// 📖 Catégories des fiches pratiques, dans l'ordre de la page Don. Mêmes clés que le
//    backoffice (ContenuResource) : une fiche d'une autre catégorie ne s'afficherait pas.
//    Teintes et icônes reprises des catégories de quiz qui parlent du même sujet.
export const CATEGORIES_FICHES: CategorieFiche[] = [
  { cle: 'eligibilite', libelle: 'Éligibilité au don', court: 'Éligibilité', icone: 'people-outline', iconePleine: 'people', teinte: 'petrole' },
  { cle: 'processus_don', libelle: 'Processus du don', court: 'Le don', icone: 'water-outline', iconePleine: 'water', teinte: 'corail' },
  { cle: 'apres_don', libelle: 'Avant et après le don', court: 'Avant et après', icone: 'cafe-outline', iconePleine: 'cafe', teinte: 'orange' },
  { cle: 'urgences', libelle: 'Urgences et pénuries', court: 'Besoins en sang', icone: 'pulse-outline', iconePleine: 'pulse', teinte: 'mousse' },
];

// Fiche d'une catégorie inconnue (saisie hors liste) : apparence neutre.
const PAR_DEFAUT: CategorieFiche = {
  cle: 'autre',
  libelle: 'Fiche pratique',
  court: 'Autres',
  icone: 'document-text-outline',
  iconePleine: 'document-text',
  teinte: 'petrole',
};

export const categorieFiche = (cle: string): CategorieFiche =>
  CATEGORIES_FICHES.find((categorie) => categorie.cle === cle) ?? PAR_DEFAUT;
