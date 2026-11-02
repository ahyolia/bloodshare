import { act, renderHook } from '@testing-library/react-native';
import { useRelanceOnglet } from '../useRelanceOnglet';

// Navigateur d'onglets simulé : deux onglets, et une pile (l'écran) dans l'onglet Quiz.
let mockEcouteur: ((evenement: { target?: string }) => void) | null = null;
const mockOnglets = {
  getState: () => ({ type: 'tab', routes: [{ key: 'quiz-1', name: 'quiz' }, { key: 'profil-1', name: 'profil' }] }),
  getParent: () => undefined,
  addListener: (_type: string, ecouteur: (evenement: { target?: string }) => void) => {
    mockEcouteur = ecouteur;
    return () => {
      mockEcouteur = null;
    };
  },
};
jest.mock('expo-router', () => ({
  useNavigation: () => ({ getState: () => ({ type: 'stack', routes: [] }), getParent: () => mockOnglets }),
}));

describe('useRelanceOnglet', () => {
  it("change de clé à chaque appui sur l'onglet de l'écran", async () => {
    const { result } = await renderHook(() => useRelanceOnglet('quiz'));
    expect(result.current).toBe(0);

    await act(async () => mockEcouteur?.({ target: 'quiz-1' }));
    expect(result.current).toBe(1);

    await act(async () => mockEcouteur?.({ target: 'quiz-1' }));
    expect(result.current).toBe(2);
  });

  it("ignore l'appui sur un autre onglet", async () => {
    const { result } = await renderHook(() => useRelanceOnglet('quiz'));

    await act(async () => mockEcouteur?.({ target: 'profil-1' }));

    expect(result.current).toBe(0);
  });
});
