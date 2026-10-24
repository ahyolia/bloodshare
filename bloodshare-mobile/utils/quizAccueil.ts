import type { CategorieQuiz, QuizItem } from '../services/quiz.service';

export type EtatQuiz =
  | { statut: 'a_faire' }
  | { statut: 'en_cours'; repondues: number; total: number }
  | { statut: 'termine'; score: number; total: number };

/** État d'un quiz pour son badge : à faire, en cours (X/Y) ou terminé (score). */
export const etatQuiz = (quiz: QuizItem): EtatQuiz => {
  if (quiz.complete) return { statut: 'termine', score: quiz.score ?? 0, total: quiz.nb_questions };
  if (quiz.questions_repondues > 0) {
    return { statut: 'en_cours', repondues: quiz.questions_repondues, total: quiz.nb_questions };
  }
  return { statut: 'a_faire' };
};

/** Quiz commencés avec leur catégorie, pour le carrousel « à reprendre » du bandeau. */
export const quizAReprendre = (categories: CategorieQuiz[]): { quiz: QuizItem; categorie: string }[] =>
  categories.flatMap((c) =>
    c.quiz.filter((q) => etatQuiz(q).statut === 'en_cours').map((quiz) => ({ quiz, categorie: c.categorie }))
  );

/**
 * Quiz proposé par le bandeau quand rien n'est en cours : le premier pas encore fait,
 * ou `null` quand tout est terminé.
 */
export const premierQuizAFaire = (categories: CategorieQuiz[]): QuizItem | null =>
  categories.flatMap((c) => c.quiz).find((q) => etatQuiz(q).statut === 'a_faire') ?? null;

/**
 * Moyenne sur 5 des 5 derniers quiz terminés (les derniers de la liste sont les plus
 * récents), et nombre total de quiz terminés.
 * 📖 Le score compte les bonnes réponses sur nb_questions, variable d'un quiz à l'autre :
 *    chaque quiz est ramené sur 5 avant la moyenne.
 */
export const progressionQuiz = (categories: CategorieQuiz[]) => {
  const termines = categories
    .flatMap((c) => c.quiz)
    .filter((q): q is QuizItem & { score: number } => q.complete && q.score !== null);
  const cinqDerniers = termines.slice(-5);
  const surCinq = (q: QuizItem & { score: number }) => (q.nb_questions > 0 ? (q.score / q.nb_questions) * 5 : 0);

  return {
    moyenne: cinqDerniers.length > 0 ? cinqDerniers.reduce((s, q) => s + surCinq(q), 0) / cinqDerniers.length : null,
    totalTermines: termines.length,
  };
};
