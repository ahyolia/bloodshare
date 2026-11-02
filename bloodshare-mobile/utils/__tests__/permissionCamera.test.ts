import { estAppInstallee, etatPermissionCamera } from '../permissionCamera';

const permission = (granted: boolean, canAskAgain: boolean, status: 'granted' | 'denied' | 'undetermined') =>
  ({ granted, canAskAgain, status }) as Parameters<typeof etatPermissionCamera>[0];

describe('etatPermissionCamera', () => {
  describe('en natif (comportement inchangé)', () => {
    it("affiche la caméra quand l'accès est accordé", () => {
      expect(etatPermissionCamera(permission(true, true, 'granted'), false)).toBe('accordee');
    });

    it('propose la popup tant que le système peut encore la montrer', () => {
      expect(etatPermissionCamera(permission(false, true, 'undetermined'), false)).toBe('demander');
      expect(etatPermissionCamera(permission(false, true, 'denied'), false)).toBe('demander');
    });

    it('renvoie vers les réglages après un refus définitif', () => {
      expect(etatPermissionCamera(permission(false, false, 'denied'), false)).toBe('refuse');
    });
  });

  describe('sur web', () => {
    it("affiche la caméra quand l'accès est accordé", () => {
      expect(etatPermissionCamera(permission(true, true, 'granted'), true)).toBe('accordee');
    });

    it("propose la popup si le navigateur n'a encore rien demandé", () => {
      expect(etatPermissionCamera(permission(false, true, 'undetermined'), true)).toBe('demander');
    });

    // 📖 Le cas du bug : expo-camera laisse canAskAgain à true sur web.
    it("affiche l'aide navigateur après un refus, malgré canAskAgain = true", () => {
      expect(etatPermissionCamera(permission(false, true, 'denied'), true)).toBe('refuse');
    });
  });
});

describe('estAppInstallee', () => {
  const fenetre = (standaloneMedia: boolean, standaloneIos?: boolean) => ({
    matchMedia: (requete: string) => ({ matches: standaloneMedia && requete === '(display-mode: standalone)' }),
    navigator: { standalone: standaloneIos },
  });

  it("détecte l'app installée sur Android ou ordinateur (display-mode standalone)", () => {
    expect(estAppInstallee(fenetre(true))).toBe(true);
  });

  it("détecte l'app installée sur iPhone (navigator.standalone)", () => {
    expect(estAppInstallee(fenetre(false, true))).toBe(true);
  });

  it('renvoie faux dans un onglet de navigateur', () => {
    expect(estAppInstallee(fenetre(false, false))).toBe(false);
  });

  it('renvoie faux sans fenêtre (natif)', () => {
    expect(estAppInstallee(undefined)).toBe(false);
  });
});
