/**
 * COUCHE 2 — Rôles sémantiques.
 *
 * Le seul fichier de couleurs que les écrans et composants importent.
 * On ne choisit plus « du corail », on choisit « la couleur de l'action
 * principale » — et si la marque change de corail demain, un seul fichier bouge.
 */

import { Palette } from './palette';

export const Theme = {
  /** Fonds, surfaces et bordures. */
  fond: {
    page: Palette.neutre[50],
    surface: Palette.neutre[0],
    surfaceEnfoncee: Palette.neutre[100],
    bordure: Palette.neutre[200],
    pastilleCorail: Palette.corail[100],
    pastillePetrole: Palette.petrole[100],
    pastilleMousse: Palette.mousse[100],
  },

  /** Texte. */
  texte: {
    principal: Palette.aubergine[900],
    secondaire: Palette.aubergine[500],
    surAccent: Palette.neutre[0],
    desactive: Palette.aubergine[300],
  },

  /** Actions. */
  action: {
    primaire: Palette.corail[700],
    primairePresse: Palette.corail[500],
    primaireTexte: Palette.neutre[0],
    secondaireBordure: Palette.corail[700],
    secondaireTexte: Palette.corail[700],
    discreteTexte: Palette.aubergine[500],
    destructiveTexte: Palette.brique[500],
    desactiveFond: Palette.neutre[100],
    desactiveTexte: Palette.aubergine[300],
  },

  /** Couleur signature. Aplats et grandes surfaces uniquement. */
  accent: {
    signatureAplat: Palette.lime[500],
    signatureTexte: Palette.aubergine[900], // 8.98:1
  },

  /** Navigation (tab bar). */
  navigation: {
    fond: Palette.aubergine[900],
    actif: Palette.neutre[0],
    inactif: Palette.neutre[400],

    /** Bulle centrale du Don. */
    bulleFond: Palette.neutre[0],
    bulleAnneau: Palette.aubergine[900],
    bulleIcone: Palette.aubergine[500],
    bulleIconeActif: Palette.aubergine[900],
  },

  etat: {
    critique: { jauge: Palette.brique[500], surface: Palette.brique[100] },
    bas: { jauge: Palette.orange[500], surface: Palette.orange[100] },
    correct: { jauge: Palette.petrole[500], surface: Palette.petrole[100] },
    bon: { jauge: Palette.mousse[600], surface: Palette.mousse[100] },
  },

  feedback: {
    erreurTexte: Palette.brique[500],
    erreurSurface: Palette.brique[100],
    succesTexte: Palette.petrole[700],
    succesSurface: Palette.mousse[100],
  },
} as const;

/* -------------------------------------------------------------------------
 * COMPATIBILITÉ — à supprimer une fois la migration terminée.
 *
 * Valeurs strictement identiques à l'ancien fichier : tant qu'un écran n'a pas
 * été migré, il s'affiche exactement comme avant. Migration écran par écran,
 * puis suppression de ce bloc quand `grep -r "Colors\." app components` ne
 * renvoie plus rien.
 * ---------------------------------------------------------------------- */

/** @deprecated Utiliser `Theme`. */
export const Colors = {
  corail: { 500: '#F07A5E', 600: '#D6543A' },
  petrole: { 500: '#2E93A0', 600: '#136B7A' },
  lime: '#C6DA2C',
  creme: '#F6F1E4',
  cremeClair: '#FFFDF7',
  blanc: '#FFFFFF',
  aubergine: '#3E2430',
  grisMoyen: '#6A5560',
  succes: '#6E9B3E',
  attention: '#F0A03C',
  /** @deprecated Rouge sang exclu par la charte. → Theme.action.discreteTexte */
  deconnexion: { 500: '#d92c2c', 600: '#b32626' },
  fondNeutre: '#F0EDEE',
  fondRose: '#FFE8E4',
  fondBleu: '#E4F3F5',
  fondVert: '#E8F4E8',
  fondOrange: '#FFF0E4',
  fondGris: '#E8E4E6',
  fondGrisClair: '#FAFAFA',
  /** @deprecated Utiliser `Theme.etat.<niveau>.jauge`. */
  status: {
    critique: '#D8452C',
    bas: '#F0A03C',
    correct: '#2E93A0',
    bon: '#6E9B3E',
  },
};
