import { fireEvent, render, screen } from '@testing-library/react-native';
import { Champ } from '../Champ';

// 📖 Testing Library v14 : render est asynchrone, d'où les `async` / `await`.
describe('Champ', () => {
  it('affiche le libellé et le relie au champ pour les lecteurs d’écran', async () => {
    await render(<Champ libelle="Pseudo" aide="De 3 à 20 caractères." />);

    expect(screen.getByText('Pseudo')).toBeTruthy();
    expect(screen.getByLabelText('Pseudo')).toBeTruthy();
  });

  it('affiche l’aide quand il n’y a pas d’erreur', async () => {
    await render(<Champ libelle="Pseudo" aide="De 3 à 20 caractères." />);

    expect(screen.getByText('De 3 à 20 caractères.')).toBeTruthy();
  });

  it('en erreur : affiche le message à la place de l’aide', async () => {
    await render(
      <Champ libelle="Mot de passe" aide="8 caractères minimum." erreur="Encore un petit effort !" />,
    );

    expect(screen.getByText('Encore un petit effort !')).toBeTruthy();
    expect(screen.queryByText('8 caractères minimum.')).toBeNull();
  });

    it('transmet les props du TextInput', async () => {
    await render(<Champ libelle="Adresse e-mail" keyboardType="email-address" />);

    expect(screen.getByLabelText('Adresse e-mail').props.keyboardType).toBe('email-address');
  });
});

describe('Champ — mot de passe', () => {
  it('est masqué par défaut', async () => {
    await render(<Champ libelle="Mot de passe" motDePasse />);

    expect(screen.getByLabelText('Mot de passe').props.secureTextEntry).toBe(true);
  });

  it('s’affiche et se masque avec le bouton œil, dont le libellé suit l’état', async () => {
    await render(<Champ libelle="Mot de passe" motDePasse />);

    await fireEvent.press(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(screen.getByLabelText('Mot de passe').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByRole('button', { name: 'Masquer le mot de passe' }));
    expect(screen.getByLabelText('Mot de passe').props.secureTextEntry).toBe(true);
  });

  it('n’a pas de bouton œil sans motDePasse', async () => {
    await render(<Champ libelle="Pseudo" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});