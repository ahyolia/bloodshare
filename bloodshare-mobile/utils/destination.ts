/** Tout ce dont on a besoin pour décider où envoyer l'utilisateur. */
export type ContexteNavigation = {
  /** Token d'authentification, ou `null` si l'utilisateur n'est pas connecté. */
  token: string | null;
  /** L'onboarding a-t-il déjà été vu sur cet appareil ? */
  onboardingVu: boolean;
  /** Un admin a réinitialisé le mot de passe : l'utilisateur doit en choisir un nouveau. */
  doitChangerMdp: boolean;
  inAuthGroup: boolean;
  inTabsGroup: boolean;
  inChangerMdpGroup: boolean;
  /** Écrans publics (documents juridiques, mot de passe oublié), ouverts connecté ou non. */
  inPublicGroup: boolean;
};

export type Destination =
  | '/auth/onboarding'
  | '/auth/login'
  | '/changer-mot-de-passe?force=1'
  | '/tabs';

/**
 * Décide où doit aller l'utilisateur, ou renvoie `null` s'il est déjà
 * au bon endroit.
 *
 * 📖 Fonction pure : elle ne lit ni le stockage ni la navigation, elle reçoit
 *    tout en paramètre. Les lectures asynchrones (token, onboarding, user)
 *    restent dans `app/_layout.tsx`. C'est ce qui permet de tester chaque cas
 *    sans monter de composant.
 */
export const choisirDestination = ({
  token,
  onboardingVu,
  doitChangerMdp,
  inAuthGroup,
  inTabsGroup,
  inChangerMdpGroup,
  inPublicGroup,
}: ContexteNavigation): Destination | null => {
  // 📖 Les CGU et la politique de confidentialité se lisent depuis l'inscription (pas
  //    encore de token) comme depuis le profil : on n'y redirige jamais personne.
  if (inPublicGroup) return null;

  if (!token) {
    if (inAuthGroup) return null;

    // 📖 Première ouverture sur cet appareil → onboarding, sinon connexion.
    return onboardingVu ? '/auth/login' : '/auth/onboarding';
  }

  // 📖 Un mdp réinitialisé par un admin (voir UserResource) oblige l'utilisateur à
  //    en choisir un nouveau avant d'accéder au reste de l'app, où qu'il navigue.
  if (doitChangerMdp && !inChangerMdpGroup) {
    return '/changer-mot-de-passe?force=1';
  }

  // 📖 `!inTabsGroup` et non `inAuthGroup` : au lancement on est sur `app/index.tsx`
  //    (ni `auth`, ni `tabs`). Avec `inAuthGroup`, l'utilisateur connecté restait
  //    bloqué sur l'écran de chargement.
  if (!inTabsGroup) return '/tabs';

  return null;
};
