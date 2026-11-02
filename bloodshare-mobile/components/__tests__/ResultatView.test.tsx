import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { QUESTIONS } from '../../constants/eligibilite';
import { ResultatView } from '../eligibilite/ResultatView';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  usePathname: () => '/tabs/don/eligibilite',
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// Les confettis du résultat favorable : sans intérêt ici.
jest.mock('../quiz/Confettis', () => ({ Confettis: () => null }));

const question = (id: number) => QUESTIONS.find((q) => q.id === id)!;

beforeEach(() => jest.clearAllMocks());

describe('ResultatView', () => {
  it('propose de prendre rendez-vous quand on semble pouvoir donner', async () => {
    const ouvrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<ResultatView resultat={{ statut: 'eligible' }} onRecommencer={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Prendre rendez-vous' }));

    expect(ouvrir).toHaveBeenCalledWith('https://www.dondusang.nc/reservation-en-ligne/');
  });

  it('s’adapte à la question : un délai pour une opération récente', async () => {
    const operation = question(11);
    await render(<ResultatView resultat={{ statut: 'bloque', question: operation, reponse: 'oui' }} onRecommencer={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Il vaut mieux attendre un peu' })).toBeTruthy();
    expect(screen.getByText(operation.texte)).toBeTruthy();
    expect(screen.getByText(operation.motif)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Prendre rendez-vous' })).toBeNull();
  });

  it('s’adapte à la question : un critère non rempli pour l’âge', async () => {
    await render(<ResultatView resultat={{ statut: 'bloque', question: question(1), reponse: 'non' }} onRecommencer={jest.fn()} />);

    expect(screen.getByRole('header', { name: /Ce critère n.est pas rempli/ })).toBeTruthy();
  });

  it('s’adapte à la question : un avis médical pour un antécédent', async () => {
    await render(<ResultatView resultat={{ statut: 'bloque', question: question(9), reponse: 'oui' }} onRecommencer={jest.fn()} />);

    expect(screen.getByRole('header', { name: /À voir avec un médecin/ })).toBeTruthy();
  });

  it('après « Je ne sais pas », rappelle la question, son explication et ce qu’il faut savoir', async () => {
    const onRecommencer = jest.fn();
    const fibroscopie = question(10);
    await render(<ResultatView resultat={{ statut: 'a_verifier', question: fibroscopie }} onRecommencer={onRecommencer} />);

    expect(screen.getByText(/Tu as répondu.*Je ne sais pas/)).toBeTruthy();
    expect(screen.getByText(fibroscopie.texte)).toBeTruthy();
    expect(screen.getByText(fibroscopie.sous_texte!)).toBeTruthy();
    expect(screen.getByText(fibroscopie.motif)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Recommencer le questionnaire' }));
    expect(onRecommencer).toHaveBeenCalled();
  });
});
