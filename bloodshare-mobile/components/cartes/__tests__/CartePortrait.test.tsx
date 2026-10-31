import { fireEvent, render, screen } from '@testing-library/react-native';
import { CartePortrait } from '../CartePortrait';

const URL = 'http://localhost:8000/storage/visuels/cartes/mois-11.webp';

describe('CartePortrait', () => {
  it("ouvre une carte obtenue et annonce le nombre d'exemplaires", async () => {
    const ouvrir = jest.fn();
    await render(
      <CartePortrait
        titre="Carte Novembre"
        legende="Novembre"
        imageUrl={URL}
        obtenue
        quantite={2}
        largeur={108}
        onPress={ouvrir}
      />
    );

    await fireEvent.press(screen.getByLabelText('Carte Novembre, carte obtenue, 2 exemplaires'));

    expect(ouvrir).toHaveBeenCalled();
    expect(screen.getByTestId('carte-illustration').props.source).toEqual({ uri: URL });
    expect(screen.getByText('×2')).toBeTruthy();
  });

  it("montre une carte pas encore obtenue en aperçu grisé, sans l'ouvrir", async () => {
    const ouvrir = jest.fn();
    await render(
      <CartePortrait
        titre="Carte Décembre"
        legende="Décembre"
        imageUrl={URL}
        obtenue={false}
        largeur={108}
        onPress={ouvrir}
      />
    );

    await fireEvent.press(screen.getByLabelText('Carte Décembre, carte à obtenir'));

    expect(ouvrir).not.toHaveBeenCalled();
    expect(screen.getByTestId('carte-illustration').props.style).toContainEqual(
      expect.objectContaining({ filter: 'grayscale(1)' })
    );
    expect(screen.getByText('Décembre')).toBeTruthy();
  });
});
