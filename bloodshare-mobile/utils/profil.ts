// 📖 Initiale affichée dans l'avatar quand aucune image n'est disponible
//    (même règle que l'AppHeader).
export const initialePseudo = (pseudo: string | undefined | null): string =>
  pseudo ? pseudo.charAt(0).toUpperCase() : '?';
