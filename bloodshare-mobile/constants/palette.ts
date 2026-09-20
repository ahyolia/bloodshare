/**
 * COUCHE 1 — Palette brute.
 *
 * Les valeurs physiques de la marque, nommées par teinte.
 * C'est la source de vérité des hex du projet.
 */

export const Palette = {
  /** Texte et éléments sombres. 900 = couleur de texte officielle. */
  aubergine: {
    900: '#3E2430',
    500: '#6A5560',
    300: '#8A7A82',
  },

  /** Fonds et surfaces neutres. */
  neutre: {
    0: '#FFFDF7',
    50: '#F6F1E4',
    100: '#F0EDEE',
    200: '#E8E4E6',
    400: '#B9AFB4',
    blanc: '#FFFFFF',
  },

  /** Corail — couleur de marque, porte l'action principale. */
  corail: {
    100: '#FFE8E4',
    500: '#F07A5E',
    700: '#A83B24',
  },

  /** Pétrole — couleur secondaire, informations calmes. */
  petrole: {
    100: '#E4F3F5',
    500: '#2E93A0',
    700: '#136B7A',
  },

  /** Lime — couleur signature. Aplats et grandes surfaces uniquement. */
  lime: {
    500: '#C6DA2C',
  },

  /** Mousse et vert — succès, stock « Bon ». */
  mousse: {
    100: '#E8F4E8',
    500: '#6E9B3E',
    600: '#5FA046',
  },

  /** Orange — état « Bas ». */
  orange: {
    100: '#FDEBD3',
    500: '#F0A03C',
  },

  /** Brique — état « Critique ». Pas un rouge sang : c'est volontaire. */
  brique: {
    100: '#FBE3DE',
    500: '#D8452C',
  },
} as const;