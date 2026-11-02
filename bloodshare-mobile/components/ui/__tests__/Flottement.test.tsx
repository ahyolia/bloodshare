import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { Flottement } from '../Flottement';

describe('Flottement', () => {
  afterEach(() => jest.restoreAllMocks());

  it('affiche son contenu', async () => {
    await render(
      <Flottement>
        <Text>Rond</Text>
      </Flottement>,
    );

    expect(screen.getByText('Rond')).toBeTruthy();
  });

  it('flotte en continu', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const loop = jest.spyOn(Animated, 'loop');

    await render(
      <Flottement>
        <Text>Rond</Text>
      </Flottement>,
    );

    // Deux boucles (horizontale et verticale), sans nombre de répétitions : sans fin.
    await waitFor(() => expect(loop).toHaveBeenCalledTimes(2));
    expect(loop).toHaveBeenCalledWith(expect.anything());
  });

  it("reste immobile si « Réduire les animations » est activé", async () => {
    const reduire = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const loop = jest.spyOn(Animated, 'loop');

    await render(
      <Flottement>
        <Text>Rond</Text>
      </Flottement>,
    );
    // 📖 On attend la réponse du réglage, sinon le test passerait même sans la vérifier.
    await waitFor(() => expect(reduire).toHaveBeenCalled());
    await act(async () => {});

    expect(loop).not.toHaveBeenCalled();
  });
});
