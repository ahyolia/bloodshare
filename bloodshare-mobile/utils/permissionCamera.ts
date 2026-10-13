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
