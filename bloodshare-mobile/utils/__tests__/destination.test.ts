import { choisirDestination, type ContexteNavigation } from '../destination';

// 📖 Situation de départ : au lancement, sur le splash (`app/index.tsx`), donc
//    dans aucun groupe de routes. Chaque test ne précise que ce qui change,
//    ce qui rend visible la condition réellement testée.
const contexte = (modifs: Partial<ContexteNavigation> = {}): ContexteNavigation => ({
  token: null,
  onboardingVu: false,
  doitChangerMdp: false,
  inAuthGroup: false,
  inTabsGroup: false,
  inChangerMdpGroup: false,
  ...modifs,
});

describe('choisirDestination', () => {
  describe('utilisateur non connecté', () => {
    it('envoie vers l’onboarding à la première ouverture', () => {
      expect(choisirDestination(contexte({ onboardingVu: false }))).toBe('/auth/onboarding');
    });

    it('envoie vers la connexion si l’onboarding a déjà été vu', () => {
      expect(choisirDestination(contexte({ onboardingVu: true }))).toBe('/auth/login');
    });

    // 📖 Sans ce cas, on serait renvoyé sur l'onboarding ou le login à chaque
    //    navigation entre les écrans d'authentification (inscription, etc.).
    it.each([
      ['onboarding pas encore vu', false],
      ['onboarding déjà vu', true],
    ])('ne redirige pas s’il est déjà dans les écrans auth (%s)', (_cas, onboardingVu) => {
      expect(choisirDestination(contexte({ inAuthGroup: true, onboardingVu }))).toBeNull();
    });

    it('renvoie hors de la zone connectée (token expiré ou déconnexion)', () => {
      expect(choisirDestination(contexte({ inTabsGroup: true, onboardingVu: true }))).toBe(
        '/auth/login'
      );
    });
  });

  describe('utilisateur connecté', () => {
    const connecte = (modifs: Partial<ContexteNavigation> = {}) =>
      contexte({ token: 'jeton', onboardingVu: true, ...modifs });

    // 📖 Protège le bug de l'écran de chargement bloqué : au lancement on n'est
    //    ni dans `auth` ni dans `tabs`, et il faut quand même rediriger.
    it('envoie vers les onglets depuis le splash', () => {
      expect(choisirDestination(connecte())).toBe('/tabs');
    });

    it('envoie vers les onglets depuis les écrans auth (juste après le login)', () => {
      expect(choisirDestination(connecte({ inAuthGroup: true }))).toBe('/tabs');
    });

    it('ne redirige pas s’il est déjà dans la zone connectée', () => {
      expect(choisirDestination(connecte({ inTabsGroup: true }))).toBeNull();
    });

    it('ne montre jamais l’onboarding, même s’il n’a pas été vu sur cet appareil', () => {
      expect(choisirDestination(connecte({ onboardingVu: false }))).toBe('/tabs');
    });
  });

  describe('mot de passe à changer', () => {
    const doitChanger = (modifs: Partial<ContexteNavigation> = {}) =>
      contexte({ token: 'jeton', onboardingVu: true, doitChangerMdp: true, ...modifs });

    it('force le changement de mot de passe depuis le splash', () => {
      expect(choisirDestination(doitChanger())).toBe('/changer-mot-de-passe?force=1');
    });

    it('force le changement même depuis les onglets', () => {
      expect(choisirDestination(doitChanger({ inTabsGroup: true }))).toBe(
        '/changer-mot-de-passe?force=1'
      );
    });

    // 📖 `_layout.tsx` compte l'écran de changement de mdp dans la zone connectée :
    //    les deux booléens sont donc vrais ensemble. Sans ce cas, redirection en boucle.
    it('ne redirige pas s’il est déjà sur l’écran de changement', () => {
      expect(
        choisirDestination(doitChanger({ inChangerMdpGroup: true, inTabsGroup: true }))
      ).toBeNull();
    });

    it('ne concerne pas un utilisateur non connecté', () => {
      expect(choisirDestination(doitChanger({ token: null }))).toBe('/auth/login');
    });
  });
});
