import type { PermissionResponse } from 'expo-camera';

// 📖 Les trois écrans possibles avant d'ouvrir le scanner :
//    - 'demander' : la popup d'autorisation peut encore s'afficher
//    - 'refuse'   : refus définitif, il faut passer par les réglages
//    - 'accordee' : on peut afficher la caméra
export type EtatPermissionCamera = 'demander' | 'refuse' | 'accordee';

type Permission = Pick<PermissionResponse, 'granted' | 'canAskAgain' | 'status'>;

// 📖 Sur web, expo-camera renvoie TOUJOURS canAskAgain = true, même après un refus,
//    alors que le navigateur ne repropose plus la popup. On se fie donc au statut
//    « denied » : sans ça, l'écran restait sur un « Autoriser la caméra » sans effet.
export const etatPermissionCamera = (permission: Permission, surWeb: boolean): EtatPermissionCamera => {
  if (permission.granted) return 'accordee';
  if (surWeb) return permission.status === 'denied' ? 'refuse' : 'demander';
  return permission.canAskAgain ? 'demander' : 'refuse';
};

type FenetreWeb = {
  matchMedia?: (requete: string) => { matches: boolean };
  // `standalone` n'existe que dans Safari iOS : absent du type Navigator du DOM.
  navigator?: object;
};

// 📖 PWA ajoutée à l'écran d'accueil : plus de barre d'adresse ni de bouton recharger,
//    les consignes « icône à gauche de l'adresse » deviennent impossibles à suivre.
//    display-mode standalone couvre Android/ordinateur ; navigator.standalone, iOS.
export const estAppInstallee = (fenetre?: FenetreWeb): boolean =>
  Boolean(
    fenetre?.matchMedia?.('(display-mode: standalone)').matches ||
      (fenetre?.navigator as { standalone?: boolean } | undefined)?.standalone
  );
