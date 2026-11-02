import type { CategorieQuiz, QuizItem } from '../../services/quiz.service';
import { etatQuiz, premierQuizAFaire, progressionQuiz, quizAReprendre } from '../quizAccueil';

const quiz = (id: number, etat: Partial<QuizItem> = {}): QuizItem => ({
  id,
  titre: `Quiz ${id}`,
  points_attribues: 20,
  complete: false,
  nb_questions: 5,
  nb_tentatives: 0,
  questions_repondues: 0,
  score: null,
  ...etat,
});

const categories = (...quiz: QuizItem[]): CategorieQuiz[] => [{ categorie: 'Le don du sang', quiz }];

describe('etatQuiz', () => {
  it('distingue à faire, en cours et terminé', () => {
    expect(etatQuiz(quiz(1))).toEqual({ statut: 'a_faire' });
    expect(etatQuiz(quiz(2, { questions_repondues: 2 }))).toEqual({ statut: 'en_cours', repondues: 2, total: 5 });
    expect(etatQuiz(quiz(3, { complete: true, score: 4 }))).toEqual({ statut: 'termine', score: 4, total: 5 });
  });
});

describe('premierQuizAFaire', () => {
  it('propose le premier quiz pas encore commencé', () => {
    const aFaire = quiz(3);

    expect(
      premierQuizAFaire(categories(quiz(1, { complete: true, score: 5 }), quiz(2, { questions_repondues: 1 }), aFaire))
    ).toBe(aFaire);
  });

  it('ne propose rien quand tout est terminé', () => {
    expect(premierQuizAFaire(categories(quiz(1, { complete: true, score: 5 })))).toBeNull();
  });
});

describe('quizAReprendre', () => {
  it('ne garde que les quiz commencés et pas terminés, avec leur catégorie', () => {
    const enCours = quiz(2, { questions_repondues: 3 });

    expect(quizAReprendre(categories(quiz(1), enCours, quiz(3, { complete: true, score: 1 })))).toEqual([
      { quiz: enCours, categorie: 'Le don du sang' },
    ]);
  });
});

describe('progressionQuiz', () => {
  const termine = (id: number, score: number, nb: number) =>
    quiz(id, { complete: true, score, nb_questions: nb });

  it('ramène chaque score sur 5 avant la moyenne', () => {
    const { moyenne, totalTermines } = progressionQuiz(categories(termine(1, 10, 10), termine(2, 2, 4)));

    expect(moyenne).toBeCloseTo((5 + 2.5) / 2);
    expect(totalTermines).toBe(2);
  });

  it('fait la moyenne de tous les quiz terminés, toutes catégories confondues', () => {
    const { moyenne, totalTermines } = progressionQuiz([
      { categorie: 'Le don du sang', quiz: [1, 2, 3, 4].map((id) => termine(id, 5, 5)) },
      { categorie: 'Après le don', quiz: [termine(5, 0, 5), termine(6, 0, 5), quiz(7)] },
    ]);

    expect(moyenne).toBeCloseTo((4 * 5) / 6);
    expect(totalTermines).toBe(6);
  });

  it("n'a pas de moyenne sans quiz terminé", () => {
    expect(progressionQuiz(categories(quiz(1))).moyenne).toBeNull();
  });
});
