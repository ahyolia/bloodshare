import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import QuizScreen from '../../app/tabs/quiz';
import { getQuizCategories, type CategorieQuiz } from '../../services/quiz.service';

// 📖 Test placé hors de app/ : Expo Router y transformerait tout fichier en route.
const mockPush = jest.fn();
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect } = require('react');
  return {
    useRouter: () => ({ push: mockPush }),
    // L'écran charge ses quiz au focus : on le simule par un effet au montage.
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
jest.mock('../../services/quiz.service', () => ({ getQuizCategories: jest.fn() }));

const mockGetQuizCategories = getQuizCategories as jest.Mock;

const quiz = (id: number, titre: string, etat: object = {}) => ({
  id,
  titre,
  points_attribues: 20,
  complete: false,
  nb_questions: 5,
  nb_tentatives: 0,
  questions_repondues: 0,
  score: null,
  ...etat,
});

const CATEGORIES: CategorieQuiz[] = [
  { categorie: 'Qui peut donner ?', quiz: [quiz(1, 'Les critères de base', { questions_repondues: 2 })] },
  { categorie: 'Le don du sang', quiz: [quiz(2, 'Le jour du don', { complete: true, score: 4 })] },
];

const afficher = async (categories = CATEGORIES) => {
  mockGetQuizCategories.mockResolvedValue(categories);
  await render(<QuizScreen />);
  await waitFor(() => expect(screen.getByRole('header', { name: 'Catégories' })).toBeTruthy());
};

beforeEach(() => jest.clearAllMocks());

describe('écran Quiz', () => {
  it('affiche les quiz de la catégorie touchée', async () => {
    await afficher();

    // Première catégorie par défaut : son quiz apparaît, pas celui de l'autre catégorie.
    expect(screen.queryByText('Le jour du don')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Le don du sang, 1 quiz' }));

    expect(screen.getByRole('button', { name: /Le jour du don.*Terminé · 4\/5/ })).toBeTruthy();
  });

  it('le carrousel « Quiz en cours » propose de reprendre chaque quiz commencé', async () => {
    await afficher([
      {
        categorie: 'Qui peut donner ?',
        quiz: [
          quiz(1, 'Les critères de base', { questions_repondues: 2 }),
          quiz(3, 'Santé et délais', { questions_repondues: 1 }),
        ],
      },
    ]);
    // Le carrousel attend sa largeur pour afficher ses cartes.
    await fireEvent(screen.getByTestId('carrousel-quiz'), 'layout', {
      nativeEvent: { layout: { width: 320, height: 200 } },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Reprendre Santé et délais' }));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tabs/quiz/[id]', params: { id: 3 } });
    expect(screen.getByRole('header', { name: 'Quiz en cours' })).toBeTruthy();
  });

  it('le bandeau propose un quiz à commencer quand rien n’est en cours', async () => {
    await afficher([{ categorie: 'Le don du sang', quiz: [quiz(2, 'Le jour du don')] }]);

    await fireEvent.press(screen.getByRole('button', { name: 'Commencer un quiz' }));

    expect(screen.getByRole('header', { name: 'Teste tes connaissances' })).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Quiz en cours' })).toBeNull();
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tabs/quiz/[id]', params: { id: 2 } });
  });

  it('le bandeau félicite quand tous les quiz sont terminés', async () => {
    await afficher([{ categorie: 'Le don du sang', quiz: [quiz(2, 'Le jour du don', { complete: true, score: 5 })] }]);

    expect(screen.getByText(/Tu as terminé tous les quiz/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Commencer un quiz|Reprendre/ })).toBeNull();
  });
});
