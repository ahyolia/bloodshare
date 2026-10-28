import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import AccueilScreen from '../../app/tabs';
import { getActualites } from '../../services/actualites.service';
import { getBanniere } from '../../services/bannieres.service';
import { getDefiActuel } from '../../services/defis.service';
import { getEvenements, type Evenement } from '../../services/evenements.service';
import { getProfil } from '../../services/profil.service';
import { getStockSang } from '../../services/stockSang.service';

// 📖 Test placé hors de app/ : Expo Router y transformerait tout fichier en route.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  // Hors barre d'onglets : aucun appui à écouter (useRelanceOnglet).
  useNavigation: () => ({ getState: () => undefined, getParent: () => undefined }),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('../EnTete', () => ({ EnTete: () => null }));
jest.mock('../../hooks/useNotificationsNonLues', () => ({ useNotificationsNonLues: () => 0 }));
jest.mock('../../services/profil.service', () => ({ getProfil: jest.fn() }));
jest.mock('../../services/bannieres.service', () => ({ getBanniere: jest.fn() }));
jest.mock('../../services/stockSang.service', () => ({
  ...jest.requireActual('../../services/stockSang.service'),
  getStockSang: jest.fn(),
}));
jest.mock('../../services/defis.service', () => ({ getDefiActuel: jest.fn() }));
jest.mock('../../services/actualites.service', () => ({ getActualites: jest.fn() }));
jest.mock('../../services/evenements.service', () => ({ getEvenements: jest.fn() }));

const evenement = (id: number, titre: string): Evenement => ({
  id,
  titre,
  date_heure: '2099-09-20T09:00:00Z',
  horaire_fin: '2099-09-20T17:00:00Z',
  lieu: 'Place des Cocotiers, Nouméa',
});

const reussir = () => {
  (getProfil as jest.Mock).mockResolvedValue(null);
  (getBanniere as jest.Mock).mockResolvedValue({
    active: true,
    type: 'urgence',
    titre: 'Réserves en tension',
    message: 'Les stocks O- sont critiques.',
  });
  (getStockSang as jest.Mock).mockResolvedValue([
    { groupe: 'O-', niveau: 'critique' },
    { groupe: 'A+', niveau: 'bon' },
  ]);
  (getDefiActuel as jest.Mock).mockResolvedValue({
    titre: '500 dons pour la fin d’année',
    progression_actuelle: 320,
    objectif_chiffre: 500,
  });
  (getActualites as jest.Mock).mockResolvedValue([
    { id: 1, titre: 'Un nouveau centre ouvre à Dumbéa', image_url: null, published_at: '2026-08-12' },
  ]);
  (getEvenements as jest.Mock).mockResolvedValue([
    evenement(1, 'Collecte des Cocotiers'),
    evenement(2, 'Campus UNC'),
    evenement(3, 'Forum de Dumbéa'),
    evenement(4, 'Collecte de Païta'),
  ]);
};

const toutRejeter = () => {
  [getProfil, getBanniere, getStockSang, getDefiActuel, getActualites, getEvenements].forEach((service) =>
    (service as jest.Mock).mockRejectedValue(new Error('réseau'))
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('écran Accueil', () => {
  it('affiche la bannière, les réserves par groupe et le défi du mois', async () => {
    reussir();
    await render(<AccueilScreen />);

    await waitFor(() => expect(screen.getByText('Réserves de sang')).toBeTruthy());
    expect(screen.getByLabelText(/Urgence\. Réserves en tension/)).toBeTruthy();
    expect(screen.getByText('Besoin urgent en O−. Ton don compte !')).toBeTruthy();
    expect(screen.getByLabelText('O négatif, stock critique')).toBeTruthy();
    // Groupe absent de la réponse : affiché quand même, comme non communiqué.
    expect(screen.getByLabelText('AB positif, stock non communiqué')).toBeTruthy();
    expect(screen.getByText('500 dons pour la fin d’année')).toBeTruthy();
  });

  it('place les groupes qui manquent le plus en tête du carrousel', async () => {
    reussir();
    (getStockSang as jest.Mock).mockResolvedValue([
      { groupe: 'O-', niveau: 'bon' },
      { groupe: 'B+', niveau: 'bas' },
      { groupe: 'AB-', niveau: 'critique' },
    ]);
    await render(<AccueilScreen />);

    const ordre = (await screen.findAllByLabelText(/, stock /)).map((g) => g.props.accessibilityLabel);
    expect(ordre.slice(0, 3)).toEqual(['AB négatif, stock critique', 'B positif, stock bas', 'O négatif, stock bon']);
  });

  it('le bloc des réserves ouvre la prise de rendez-vous', async () => {
    reussir();
    const ouvrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<AccueilScreen />);

    await fireEvent.press(await screen.findByRole('link', { name: 'Prendre rendez-vous' }));

    expect(ouvrir).toHaveBeenCalledWith('https://www.dondusang.nc/reservation-en-ligne/');
  });

  it('ouvre l’actualité touchée', async () => {
    reussir();
    await render(<AccueilScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: /Un nouveau centre ouvre à Dumbéa, publiée le 12 août/ }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/detail/actualite/[id]', params: expect.objectContaining({ id: '1' }) })
    );
  });

  it('montre trois événements, puis tous sur demande', async () => {
    reussir();
    await render(<AccueilScreen />);

    await screen.findByText('Collecte des Cocotiers');
    expect(screen.queryByText('Collecte de Païta')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Voir tous les événements (4)' }));

    expect(screen.getByText('Collecte de Païta')).toBeTruthy();
  });

  it('propose de réessayer quand rien n’a pu être chargé', async () => {
    toutRejeter();
    await render(<AccueilScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(getStockSang).toHaveBeenCalledTimes(2));
  });

  it('affiche les réserves sans attendre une requête lente', async () => {
    reussir();
    // Actualités qui ne répondent pas (réseau lent) : elles ne bloquent pas l'accueil.
    (getActualites as jest.Mock).mockReturnValue(new Promise(() => {}));
    await render(<AccueilScreen />);

    expect(await screen.findByText('Réserves de sang', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText('500 dons pour la fin d’année')).toBeTruthy();
    // Pas de faux « vide » pendant que les actualités arrivent.
    expect(screen.queryByText('Pas encore d’actualité')).toBeNull();
  });

  it('garde le reste de la page quand seuls les niveaux échouent', async () => {
    reussir();
    (getStockSang as jest.Mock).mockRejectedValue(new Error('réseau'));
    await render(<AccueilScreen />);

    expect(await screen.findByText(/Les niveaux font une pause/)).toBeTruthy();
    expect(screen.getByText('500 dons pour la fin d’année')).toBeTruthy();
  });
});
