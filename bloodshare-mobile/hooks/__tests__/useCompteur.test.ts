import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useCompteur } from '../useCompteur';

afterEach(() => jest.restoreAllMocks());

describe('useCompteur', () => {
  it('affiche tout de suite la valeur finale si « Réduire les animations » est activé', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const { result } = await renderHook(() => useCompteur(4, 700));

    await waitFor(() => expect(result.current).toBe(4));
  });

  it('monte jusqu’à la valeur finale sinon', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);

    const { result } = await renderHook(() => useCompteur(3, 50));

    await waitFor(() => expect(result.current).toBe(3));
  });

  it('reste à 0 pour un score nul', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);

    const { result } = await renderHook(() => useCompteur(0, 50));

    await waitFor(() => expect(result.current).toBe(0));
  });
});
