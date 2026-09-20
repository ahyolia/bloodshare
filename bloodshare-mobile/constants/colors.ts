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
    /** Pastilles douces pour catégoriser un contenu (texte en texte.principal). */
    pastilleCorail: Palette.corail[100],
    pastillePetrole: Palette.petrole[100],
    pastilleMousse: Palette.mousse[100],
  },

  /** Texte. */
  texte: {
    principal: Palette.aubergine[900],
    secondaire: Palette.aubergine[500],
    /** Texte posé sur un aplat sombre ou saturé (bouton primaire, bulle Don). */
    surAccent: Palette.neutre[0],
    /** Uniquement pour un contrôle réellement inactif. Jamais du contenu. */
    desactive: Palette.aubergine[300],
  },

  /** Actions. */
  action: {
    primaire: Palette.corail[700],
    primairePresse: Palette.corail[500],
    primaireTexte: Palette.neutre[0],
    /** Bouton secondaire : contour, pas d'aplat. */
    secondaireBordure: Palette.corail[700],
    secondaireTexte: Palette.corail[700],
    /** Action discrète et réversible — déconnexion, annuler, passer. */
    discreteTexte: Palette.aubergine[500],
    /** Action destructive et irréversible — supprimer mon compte. Rien d'autre. */
    destructiveTexte: Palette.brique[500],
    desactiveFond: Palette.neutre[100],
    desactiveTexte: Palette.aubergine[300],
  },

  /** Couleur signature. Aplats et grandes surfaces uniquement. */
  accent: {
    /** Jamais en texte ni en icône fine : 1.38:1 sur crème. */
    signatureAplat: Palette.lime[500],
    /** Texte à poser sur cet aplat. */
    signatureTexte: Palette.aubergine[900], // 8.98:1
  },

  /**
   * Navigation (tab bar).
   *
   * La barre est une pilule sombre flottante : ses couleurs sont donc les
   * seules du thème à être pensées SUR APLAT FONCÉ. C'est le seul endroit à
   * modifier pour changer l'allure de la navigation.
   */
  navigation: {
    fond: Palette.aubergine[900],
    actif: Palette.neutre[0], // 12.6:1 sur la pilule
    inactif: Palette.neutre[400], // 5.9:1 sur la pilule

    /** Bulle centrale du Don. */
    bulleFond: Palette.neutre[0],
    /**
     * Anneau qui détache la bulle de la pilule. Volontairement de la même
     * couleur que le fond de la barre : il se lit comme un vide découpé dans
     * la pilule, pas comme un contour. Il ne signale donc RIEN — il est
     * toujours visible, page Don ouverte ou non.
     */
    bulleAnneau: Palette.aubergine[900],
    /**
     * C'est l'icône, elle, qui porte l'état de l'onglet Don : atténuée
     * ailleurs dans l'app (6.4:1 sur la bulle crème), pleine et sombre sur la
     * page Don (11.9:1).
     */
    bulleIcone: Palette.aubergine[500],
    bulleIconeActif: Palette.aubergine[900],
  },

  /**
   * Niveaux de stock sanguin.
   *
   * ⚠️ Piège à contraste : aucune de ces 4 teintes ne peut porter du texte.
   * Aubergine sur « correct » plein = 3.87:1, sur « critique » plein = 3.21:1.
   * Le motif correct est donc :
   *   `jauge`   = remplissage de la barre / du point (décoratif, sans texte)
   *   `surface` = fond de la pastille, le libellé s'écrit en texte.principal
   * Et toujours une icône + le mot (« Critique », « Bas »…) à côté.
   */
  etat: {
    critique: { jauge: Palette.brique[500], surface: Palette.brique[100] },
    bas: { jauge: Palette.orange[500], surface: Palette.orange[100] },
    correct: { jauge: Palette.petrole[500], surface: Palette.petrole[100] },
    bon: { jauge: Palette.mousse[600], surface: Palette.mousse[100] },
  },

  /** Retours système (erreur de formulaire, confirmation). */
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
