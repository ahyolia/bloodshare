import { fireEvent, render, screen, within } from '@testing-library/react-native';
import NotificationsScreen from '../../app/notifications';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationItem } from '../../services/notifications.service';

// 📖 Test placé hors de app/ : Expo Router y transformerait tout fichier en route.
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
  usePathname: () => '/notifications',
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('../../hooks/useNotifications');

const mockUseNotifications = useNotifications as jest.Mock;
const marquerToutesLues = jest.fn();

const notif = (id: string, lue: boolean): NotificationItem => ({
  id,
  titre: `Notif ${id}`,
  corps: 'Corps',
  lue,
  categorie: 'quiz',
  date: '2026-10-20T09:00:00Z',
});

const afficher = async (notifications: NotificationItem[]) => {
  mockUseNotifications.mockReturnValue({
    notifications,
    loading: false,
    chargementSuite: false,
    error: false,
    marquerLue: jest.fn(),
    marquerToutesLues,
    chargerPlus: jest.fn(),
    recharger: jest.fn(),
  });
  await render(<NotificationsScreen />);
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

  it("n'affiche pas le bouton sans notification non lue", async () => {
    await afficher([notif('b', true)]);

    expect(screen.getByRole('header', { name: 'Déjà lues' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tout marquer comme lu' })).toBeNull();
  });
});
