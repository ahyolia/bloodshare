import { fireEvent, render, screen } from '@testing-library/react-native';
import { ElementListe } from '../ElementListe';

describe('ElementListe', () => {
  it('annonce le titre et le sous-titre ensemble', async () => {
    await render(
      <ElementListe
        titre="Historique des dons"
        sousTitre="3 cartes-souvenirs collectées"
        icone="calendar-outline"
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Historique des dons, 3 cartes-souvenirs collectées' }),
    ).toBeTruthy();
  });

  it('appelle onPress à l’appui', async () => {
    const onPress = jest.fn();
    await render(<ElementListe titre="Parrainage" icone="gift-outline" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});