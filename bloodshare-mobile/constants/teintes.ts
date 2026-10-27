/**
 * Teintes des pastilles d'icône (lignes de liste, cartes chiffres, historiques),
 * reprises des cartes de l'onboarding : un fond pâle et une icône lisible dessus.
 *
 * 📖 L'icône garde un contraste ≥ 3:1 sur son fond : aubergine sur l'orange et la
 *    mousse, dont les teintes foncées seraient trop claires pour une icône.
 */
import { Palette } from './palette';
import { Theme } from './colors';

export type TeintePastille = 'petrole' | 'corail' | 'mousse' | 'orange';

export const TEINTES_PASTILLE: Record<TeintePastille, { fond: string; icone: string }> = {
  petrole: { fond: Theme.info.fond, icone: Theme.info.icone },
  corail: { fond: Theme.marque.doux, icone: Theme.marque.principal },
  mousse: { fond: Theme.fond.pastilleMousse, icone: Theme.texte.principal },
  orange: { fond: Palette.orange[100], icone: Theme.texte.principal },
};

/**
 * Couleur vive de chaque teinte, pour les formes décoratives (jamais pour du texte ni
 * une icône seule : elles n'ont pas le contraste suffisant sur fond clair).
 */
export const TEINTES_VIVES: Record<TeintePastille, string> = {
  petrole: Palette.petrole[500],
  corail: Palette.corail[500],
  mousse: Palette.mousse[500],
  orange: Palette.orange[500],
};
