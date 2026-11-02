import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import DonScreen from '../../app/tabs/don';
import type { Reponse } from '../../constants/eligibilite';
import { getFichesInfos, type FicheInfo } from '../../services/fichesInfos.service';
import { effacerQuestionnaire, enregistrerQuestionnaire, lireQuestionnaire } from '../../stores/eligibilite.store';

// 📖 Test placé hors de app/ : Expo Router y transformerait tout fichier en route.
const mockPush = jest.fn();
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect } = require('react');
  return {
    useRouter: () => ({ push: mockPush }),
    useLocalSearchParams: () => ({}),
    // Le questionnaire en cours est relu au focus : on le simule par un effet au montage.
    useFocusEffect: (effet: () => void) => useEffect(effet, [effet]),
    // Hors barre d'onglets : aucun appui à écouter (useRelanceOnglet).
    useNavigation: () => ({ getState: () => undefined, getParent: () => undefined }),
  };
});
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('../EnTete', () => ({ EnTete: () => null }));
jest.mock('../../hooks/useProfil', () => ({ useProfil: () => ({ profil: null }) }));
jest.mock('../../hooks/useNotificationsNonLues', () => ({ useNotificationsNonLues: () => 0 }));
jest.mock('../../services/fichesInfos.service', () => ({ getFichesInfos: jest.fn() }));

const mockGetFiches = getFichesInfos as jest.Mock;

const fiche = (id: number, titre: string, categorie: string, etat: Partial<FicheInfo> = {}): FicheInfo => ({
  id,
  titre,
  categorie,
  contenu: 'Un texte court.',
  quiz_cta: true,
  le_saviez_vous: null,
  quiz_lies: [],
  ...etat,
});

const FICHES = [
  fiche(1, 'Qui peut donner son sang ?', 'eligibilite', { quiz_lies: [{ id: 6, titre: 'Les critères de base' }] }),
  fiche(2, 'Comment se déroule un don de sang ?', 'processus_don'),
];

const afficher = async (fiches: FicheInfo[] = FICHES) => {
  mockGetFiches.mockResolvedValue(fiches);
  await render(<DonScreen />);
  await waitFor(() => expect(screen.getByRole('button', { name: /Qui peut donner son sang/ })).toBeTruthy());
};

beforeEach(() => {
  jest.clearAllMocks();
  effacerQuestionnaire();
});

describe('écran Don', () => {
  it('le bandeau ouvre le scanner', async () => {
    await afficher();

    await fireEvent.press(screen.getByRole('button', { name: 'Scanner un QR code' }));

    expect(mockPush).toHaveBeenCalledWith('/tabs/don/scan');
  });

  it('le carrousel montre toutes les fiches et ouvre celle touchée', async () => {
    await afficher();

    // Avec l'indication du quiz lié quand il y en a un.
    expect(screen.getByRole('button', { name: /Qui peut donner son sang.*avec un quiz/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Comment se déroule un don de sang/ }));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tabs/don/fiche/[id]', params: { id: 2 } });
  });

  it('les filtres ne gardent dans le carrousel que les fiches de la catégorie choisie', async () => {
    await afficher();

    await fireEvent.press(screen.getByRole('button', { name: 'Le don, 1 fiche' }));

    expect(screen.queryByText('Qui peut donner son sang ?')).toBeNull();
    expect(screen.getByRole('button', { name: /Comment se déroule un don de sang/ })).toBeTruthy();
  });

  it('n’affiche pas de filtres quand toutes les fiches sont dans la même catégorie', async () => {
    await afficher([FICHES[0]]);

    expect(screen.queryByRole('button', { name: /^Tout/ })).toBeNull();
  });

  it('propose de reprendre ou de recommencer un questionnaire commencé', async () => {
    enregistrerQuestionnaire(['non', 'non'] as Reponse[]);
    await afficher();

    expect(screen.getByRole('button', { name: /Suis-je éligible.*question 3 sur/ })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Recommencer le questionnaire' }));

    expect(lireQuestionnaire()).toEqual([]);
    expect(mockPush).toHaveBeenCalledWith('/tabs/don/eligibilite');
  });

  it('ouvre la réservation sur le site du Don du Sang', async () => {
    const ouvrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await afficher();

    await fireEvent.press(screen.getByRole('link', { name: /Prendre rendez-vous/ }));

    expect(ouvrir).toHaveBeenCalledWith('https://www.dondusang.nc/reservation-en-ligne/');
  });
});
