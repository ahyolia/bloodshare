import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';
import { login } from '../../../services/auth.service';
import { saveToken, saveUser } from '../../../stores/auth.store';

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockParams: { session?: string } = {};
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), push: (...a: unknown[]) => mockPush(...a) },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('../../../services/auth.service', () => ({ login: jest.fn() }));
jest.mock('../../../stores/auth.store', () => ({
  saveToken: jest.fn().mockResolvedValue(undefined),
  saveUser: jest.fn().mockResolvedValue(undefined),
}));

const loginMock = login as jest.Mock;
const MESSAGE_IDENTIFIANTS = "L'e-mail ou le mot de passe ne correspond pas. Vérifie-les puis réessaie.";

const remplir = async (email = 'kaori@exemple.nc', motDePasse = 'Aima2026') => {
  await fireEvent.changeText(screen.getByLabelText('Adresse e-mail'), email);
  await fireEvent.changeText(screen.getByLabelText('Mot de passe'), motDePasse);
};
const envoyer = () => fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));
const erreurApi = (status: number, message?: string) => ({ response: { status, data: { message } } });

describe('Connexion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    // 📖 L'écran journalise le statut en dev : on garde la sortie des tests lisible.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('connecte, enregistre la session puis ouvre les onglets', async () => {
    loginMock.mockResolvedValue({ token: 'jeton', user: { id: 1 } });
    await render(<LoginScreen />);

    await remplir('  kaori@exemple.nc  ');
    await envoyer();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/tabs'));
    expect(loginMock).toHaveBeenCalledWith('kaori@exemple.nc', 'Aima2026');
    expect(saveToken).toHaveBeenCalledWith('jeton');
    expect(saveUser).toHaveBeenCalledWith({ id: 1 });
  });

  it('champs vides : une erreur sous chacun, sans appel à l’API', async () => {
    await render(<LoginScreen />);

    await envoyer();

    expect(screen.getByText('Saisis ton adresse e-mail.')).toBeTruthy();
    expect(screen.getByText('Saisis ton mot de passe.')).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('envoi en cours : « Connexion… », message d’attente, champs et liens bloqués', async () => {
    let terminer!: (v: unknown) => void;
    loginMock.mockReturnValue(new Promise((r) => (terminer = r)));
    await render(<LoginScreen />);

    await remplir();
    // 📖 Pas de `await` : en v14, fireEvent attend la fin du gestionnaire, donc ici
    //    la réponse de l'API, qu'on ne libère qu'à la fin du test.
    const envoi = envoyer();

    expect(await screen.findByText('Ça peut prendre quelques secondes.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connexion…' })).toBeBusy();
    expect(screen.getByLabelText('Adresse e-mail').props.editable).toBe(false);
    expect(screen.getByRole('link', { name: 'Inscris-toi' })).toBeDisabled();
    expect(loginMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      terminer({ token: 'jeton', user: { id: 1 } });
      await envoi;
    });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/tabs'));
  });

  it('identifiants incorrects (401) : message générique, les deux champs en erreur', async () => {
    loginMock.mockRejectedValue(erreurApi(401, 'Email ou mot de passe incorrect.'));
    await render(<LoginScreen />);

    await remplir();
    await envoyer();

    expect(await screen.findByText(MESSAGE_IDENTIFIANTS)).toBeTruthy();
    expect(screen.getByLabelText('Adresse e-mail').props['aria-invalid']).toBe(true);
    expect(screen.getByLabelText('Mot de passe').props['aria-invalid']).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('corriger un champ efface l’erreur d’identifiants', async () => {
    loginMock.mockRejectedValue(erreurApi(401));
    await render(<LoginScreen />);
    await remplir();
    await envoyer();
    await screen.findByText(MESSAGE_IDENTIFIANTS);

    await fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'Aima2027');

    expect(screen.queryByText(MESSAGE_IDENTIFIANTS)).toBeNull();
    expect(screen.getByLabelText('Adresse e-mail').props['aria-invalid']).toBe(false);
  });

  it.each([
    [403, "Ton compte est suspendu. Contacte l'association pour en savoir plus."],
    [429, 'Trop de tentatives. Patiente une minute avant de réessayer.'],
    [500, 'Le serveur a rencontré un souci. Réessaie dans un instant.'],
  ])('erreur %i : message adapté', async (statut, message) => {
    loginMock.mockRejectedValue(erreurApi(statut, statut === 403 ? message : undefined));
    await render(<LoginScreen />);

    await remplir();
    await envoyer();

    expect(await screen.findByText(message)).toBeTruthy();
  });

  it('compte suspendu (403) sans message de l’API : explique quand même la suspension', async () => {
    loginMock.mockRejectedValue(erreurApi(403, ''));
    await render(<LoginScreen />);

    await remplir();
    await envoyer();

    expect(await screen.findByText("Ton compte est suspendu. Contacte l'association pour en savoir plus.")).toBeTruthy();
  });

  it('serveur injoignable : invite à vérifier la connexion', async () => {
    loginMock.mockRejectedValue({ request: {} });
    await render(<LoginScreen />);

    await remplir();
    await envoyer();

    expect(await screen.findByText('Impossible de joindre le serveur. Vérifie ta connexion.')).toBeTruthy();
  });

  it('session expirée : le signale à l’arrivée', async () => {
    mockParams = { session: 'expiree' };
    await render(<LoginScreen />);

    expect(screen.getByText('Ta session a expiré. Reconnecte-toi.')).toBeTruthy();
  });

  it('session expirée : le bandeau disparaît dès la première tentative', async () => {
    mockParams = { session: 'expiree' };
    loginMock.mockRejectedValue(erreurApi(401));
    await render(<LoginScreen />);

    await remplir();
    await envoyer();

    expect(await screen.findByText(MESSAGE_IDENTIFIANTS)).toBeTruthy();
    expect(screen.queryByText('Ta session a expiré. Reconnecte-toi.')).toBeNull();
  });

  it('les liens mènent au mot de passe oublié et à l’inscription', async () => {
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByRole('link', { name: 'Mot de passe oublié ?' }));
    await fireEvent.press(screen.getByRole('link', { name: 'Inscris-toi' }));

    expect(mockPush).toHaveBeenCalledWith('/auth/mot-de-passe-oublie');
    expect(mockPush).toHaveBeenCalledWith('/auth/register');
  });

  it('est au tutoiement', async () => {
    await render(<LoginScreen />);

    expect(screen.queryByText(/\b(vous|votre|vos)\b/i)).toBeNull();
  });
});
