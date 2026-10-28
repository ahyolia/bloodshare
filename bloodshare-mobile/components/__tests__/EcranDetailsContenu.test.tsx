import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import ActualiteDetailScreen from '../../app/detail/actualite/[id]';
import EvenementDetailScreen from '../../app/detail/evenement/[id]';

// 📖 Test placé hors de app/ : Expo Router y transformerait tout fichier en route.
const mockNavigate = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/detail/x/1',
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('page Actualité', () => {
  it('affiche la date, le chapeau et le texte', async () => {
    mockParams = {
      id: '1',
      titre: 'Un nouveau centre ouvre à Dumbéa',
      chapo: 'Plus besoin de se rendre à Nouméa.',
      contenu: 'Le centre ouvre en septembre.',
      published_at: '2026-08-12',
      image_url: '',
      teinte: 'petrole',
    };
    await render(<ActualiteDetailScreen />);

    expect(screen.getByRole('header', { name: 'Un nouveau centre ouvre à Dumbéa' })).toBeTruthy();
    expect(screen.getByText('12 août 2026')).toBeTruthy();
    expect(screen.getByText('Plus besoin de se rendre à Nouméa.')).toBeTruthy();
    expect(screen.getByText('Le centre ouvre en septembre.')).toBeTruthy();
  });

  it('prévient quand le texte complet n’est pas encore là', async () => {
    mockParams = { id: '1', titre: 'Brève', chapo: '', contenu: '', published_at: '2026-08-12', image_url: '' };
    await render(<ActualiteDetailScreen />);

    expect(screen.getByText(/sera bientôt disponible/)).toBeTruthy();
  });
});

describe('page Événement', () => {
  beforeEach(() => {
    mockParams = {
      id: '1',
      titre: 'Collecte mobile',
      description: '',
      date_heure: '2026-09-20T09:00:00Z',
      horaire_fin: '2026-09-20T17:00:00Z',
      lieu: 'Place des Cocotiers, Nouméa',
      image_url: '',
    };
  });

  it('affiche la date en toutes lettres, l’horaire et le lieu', async () => {
    await render(<EvenementDetailScreen />);

    expect(screen.getByText('Dimanche 20 septembre 2026')).toBeTruthy();
    expect(screen.getByText('09h00 → 17h00')).toBeTruthy();
    expect(screen.getByText('Place des Cocotiers, Nouméa')).toBeTruthy();
  });

  it('ouvre le lieu sur une carte', async () => {
    const ouvrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<EvenementDetailScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Voir le lieu sur une carte' }));

    expect(ouvrir).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Place%20des%20Cocotiers%2C%20Noum%C3%A9a'
    );
  });

  it('le bandeau ouvre le scanner', async () => {
    await render(<EvenementDetailScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Scanner le QR code' }));

    expect(mockNavigate).toHaveBeenCalledWith('/tabs/don/scan');
  });
});
