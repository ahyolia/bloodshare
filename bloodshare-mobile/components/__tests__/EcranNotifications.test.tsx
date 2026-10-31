import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import NotificationsScreen from '../../app/notifications';
import { DialogueProvider } from '../DialogueProvider';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationItem } from '../../services/notifications.service';

// 📖 Test placé hors de app/ : Expo Router y transformerait tout fichier en route.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: mockPush }),
  usePathname: () => '/notifications',
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('../../hooks/useNotifications');

const mockUseNotifications = useNotifications as jest.Mock;
const marquerToutesLues = jest.fn();
const marquerLue = jest.fn();

const notif = (id: string, lue: boolean, lien: string | null = null): NotificationItem => ({
  id,
  titre: `Notif ${id}`,
  corps: 'Corps',
  lue,
  categorie: 'quiz',
  lien,
  date: '2026-10-20T09:00:00Z',
});

const afficher = async (notifications: NotificationItem[]) => {
  mockUseNotifications.mockReturnValue({
    notifications,
    loading: false,
    chargementSuite: false,
    error: false,
    marquerLue,
    marquerToutesLues,
    chargerPlus: jest.fn(),
    recharger: jest.fn(),
  });
  // L'écran prévient d'un échec de marquage par une boîte de dialogue (useDialogue).
  await render(
    <DialogueProvider>
      <NotificationsScreen />
    </DialogueProvider>,
  );
};

beforeEach(() => jest.clearAllMocks());

describe('écran Notifications', () => {
  it('place « Tout marquer comme lu » sur la ligne du titre « Nouvelles »', async () => {
    await afficher([notif('a', false), notif('b', true)]);

    const ligne = screen.getByTestId('en-tete-nouvelles');
    expect(within(ligne).getByRole('header', { name: 'Nouvelles' })).toBeTruthy();
    expect(within(ligne).getByRole('button', { name: 'Tout marquer comme lu' })).toBeTruthy();
    // Un seul bouton : il n'est plus aussi affiché sous le titre de la page.
    expect(screen.getAllByRole('button', { name: 'Tout marquer comme lu' })).toHaveLength(1);
  });

  it('marque toutes les notifications comme lues', async () => {
    await afficher([notif('a', false)]);

    await fireEvent.press(screen.getByRole('button', { name: 'Tout marquer comme lu' }));

    expect(marquerToutesLues).toHaveBeenCalledTimes(1);
  });

  it('prévient quand le serveur refuse le marquage', async () => {
    await afficher([notif('a', false)]);

    // Le hook signale l'échec par onErreurMarquage : on le déclenche comme lui.
    // 📖 Sans await sur son résultat : informer() ne se résout qu'à la fermeture de la
    //    boîte de dialogue, que personne ne ferme dans ce test.
    const { onErreurMarquage } = mockUseNotifications.mock.calls[0][0];
    await act(async () => {
      onErreurMarquage();
    });

    expect(screen.getByText('Pas enregistré')).toBeTruthy();
    expect(screen.getByText(/Vérifie ta connexion et réessaie/)).toBeTruthy();
  });

  it('ouvre la page de la notification et la marque comme lue', async () => {
    await afficher([notif('a', false, '/tabs/quiz/3')]);

    await fireEvent.press(screen.getByRole('button', { name: /Notif a/ }));

    expect(marquerLue).toHaveBeenCalledWith('a');
    expect(mockPush).toHaveBeenCalledWith('/tabs/quiz/3');
  });

  it('rouvre la page d’une notification déjà lue sans la remarquer', async () => {
    await afficher([notif('b', true, '/tabs/profil/badges')]);

    await fireEvent.press(screen.getByRole('button', { name: /Notif b/ }));

    expect(marquerLue).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/tabs/profil/badges');
  });

  it('marque comme lue sans naviguer une notification sans lien', async () => {
    await afficher([notif('a', false)]);

    await fireEvent.press(screen.getByRole('button', { name: /Notif a/ }));

    expect(marquerLue).toHaveBeenCalledWith('a');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("n'affiche pas le bouton sans notification non lue", async () => {
    await afficher([notif('b', true)]);

    expect(screen.getByRole('header', { name: 'Déjà lues' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tout marquer comme lu' })).toBeNull();
  });
});
