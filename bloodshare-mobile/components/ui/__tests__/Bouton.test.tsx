import { fireEvent, render, screen } from '@testing-library/react-native';
import { Bouton } from '../Bouton';

// 📖 Testing Library v14 : render et fireEvent sont asynchrones (React 19).
//    Sans `await`, `screen` n'est pas encore prêt quand on l'interroge.
describe('Bouton', () => {
  it('est annoncé comme un bouton avec son libellé', async () => {
    await render(<Bouton libelle="Prendre rendez-vous" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Prendre rendez-vous' })).toBeTruthy();
  });

  it("appelle onPress à l'appui", async () => {
    const onPress = jest.fn();
    await render(<Bouton libelle="Valider" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("désactivé : ne réagit pas et l'annonce", async () => {
    const onPress = jest.fn();
    await render(<Bouton libelle="Valider" onPress={onPress} desactive />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it("en chargement : bloque le double appui et l'annonce comme occupé", async () => {
    const onPress = jest.fn();
    await render(<Bouton libelle="Se connecter" onPress={onPress} chargement />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeBusy();
  });

  it('en chargement avec libelleChargement : affiche et annonce ce texte', async () => {
    await render(
      <Bouton libelle="Se connecter" libelleChargement="Connexion…" onPress={jest.fn()} chargement />,
    );

    expect(screen.getByRole('button', { name: 'Connexion…' })).toBeBusy();
    expect(screen.getByText('Connexion…')).toBeTruthy();
    expect(screen.queryByText('Se connecter')).toBeNull();
  });

  it('libelleChargement est ignoré hors chargement', async () => {
    await render(<Bouton libelle="Se connecter" libelleChargement="Connexion…" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeTruthy();
    expect(screen.queryByText('Connexion…')).toBeNull();
  });
});