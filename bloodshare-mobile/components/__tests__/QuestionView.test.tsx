import { fireEvent, render, screen } from '@testing-library/react-native';
import { QUESTIONS } from '../../constants/eligibilite';
import { QuestionView } from '../eligibilite/QuestionView';

// En-tête de sous-page et animations : simulés hors de l'app.
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), canGoBack: () => true }), usePathname: () => '/' }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const afficher = async (peutRevenirArriere: boolean) => {
  const actions = { onRepondre: jest.fn(), onRetour: jest.fn(), onQuitter: jest.fn() };
  await render(
    <QuestionView
      question={QUESTIONS[1]}
      numeroQuestion={peutRevenirArriere ? 2 : 1}
      peutRevenirArriere={peutRevenirArriere}
      {...actions}
    />
  );
  return actions;
};

describe('QuestionView', () => {
  it('quitte le questionnaire avec le bouton retour, même après la première question', async () => {
    const { onQuitter, onRetour } = await afficher(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Quitter le questionnaire' }));

    expect(onQuitter).toHaveBeenCalledTimes(1);
    expect(onRetour).not.toHaveBeenCalled();
  });

  it('revient à la question précédente avec son propre bouton', async () => {
    const { onQuitter, onRetour } = await afficher(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Question précédente' }));

    expect(onRetour).toHaveBeenCalledTimes(1);
    expect(onQuitter).not.toHaveBeenCalled();
  });

  it("n'affiche pas « Question précédente » sur la première question", async () => {
    await afficher(false);

    expect(screen.queryByRole('button', { name: 'Question précédente' })).toBeNull();
  });

  it('propose Oui, Non et Je ne sais pas', async () => {
    const { onRepondre } = await afficher(false);

    await fireEvent.press(screen.getByRole('button', { name: 'Je ne sais pas' }));

    expect(screen.getByRole('button', { name: 'Oui' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Non' })).toBeTruthy();
    expect(onRepondre).toHaveBeenCalledWith('ne_sait_pas');
  });
});
