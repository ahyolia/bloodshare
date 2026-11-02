import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Onboarding from '../onboarding';
import { setOnboardingVu } from '../../../utils/preferences';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('../../../utils/preferences', () => ({ setOnboardingVu: jest.fn().mockResolvedValue(undefined) }));

describe('Onboarding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('commence à l’écran 1, sans bouton Retour', async () => {
    await render(<Onboarding />);

    expect(screen.getByLabelText('Étape 1 sur 3')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Écran précédent' })).toBeNull();
  });

  it('Suivant puis Retour', async () => {
    await render(<Onboarding />);

    await fireEvent.press(screen.getByRole('button', { name: 'Écran suivant' }));
    expect(screen.getByLabelText('Étape 2 sur 3')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Écran précédent' }));
    expect(screen.getByLabelText('Étape 1 sur 3')).toBeTruthy();
  });

  it('Passer mène au dernier écran, qui n’a plus « Passer »', async () => {
    await render(<Onboarding />);

    await fireEvent.press(screen.getByRole('button', { name: 'Passer' }));

    expect(screen.getByLabelText('Étape 3 sur 3')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Passer' })).toBeNull();
  });

  it('S’inscrire mémorise l’onboarding puis ouvre l’inscription', async () => {
    await render(<Onboarding />);
    await fireEvent.press(screen.getByRole('button', { name: 'Passer' }));

    await fireEvent.press(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth/register'));
    expect(setOnboardingVu).toHaveBeenCalled();
  });

  it('n’affiche aucun texte provisoire des maquettes', async () => {
    await render(<Onboarding />);

    expect(screen.queryByText(/\[.*\]/)).toBeNull();
  });
});