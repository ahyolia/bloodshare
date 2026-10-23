import { fireEvent, render, screen } from '@testing-library/react-native';
import { Bloc } from '../Bloc';

describe('Bloc', () => {
  it('affiche le titre comme un titre, et le texte', async () => {
    await render(<Bloc titre="Avant ton don" texte="Prends un vrai repas." />);

    expect(screen.getByRole('header', { name: 'Avant ton don' })).toBeTruthy();
    expect(screen.getByText('Prends un vrai repas.')).toBeTruthy();
  });

  it("sans onPress, n'est pas annoncé comme un bouton", async () => {
    await render(<Bloc titre="Avant ton don" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it("avec onPress, est un bouton qui réagit à l'appui", async () => {
    const onPress = jest.fn();
    await render(<Bloc titre="Défi du mois" variante="signature" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});