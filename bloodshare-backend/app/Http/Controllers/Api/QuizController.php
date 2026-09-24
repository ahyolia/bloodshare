<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointsHistorique;
use App\Models\Quiz;
use App\Models\UserQuiz;
use App\Services\BadgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $quizzes = Quiz::where('statut', 'actif')->with('questions')->get();

        $userQuizzes = UserQuiz::where('user_id', $user->id)
            ->get()
            ->keyBy('quiz_id');

        $groupes = $quizzes->groupBy('categorie')->map(function ($quizzesDeCategorie, $categorie) use ($userQuizzes) {
            return [
                'categorie' => $categorie,
                'quiz' => $quizzesDeCategorie->map(function ($quiz) use ($userQuizzes) {
                    $userQuiz = $userQuizzes->get($quiz->id);
                    $complete = (bool) $userQuiz?->complete;

                    return [
                        'id' => $quiz->id,
                        'titre' => $quiz->titre,
                        'points_attribues' => $quiz->points_attribues,
                        'complete' => $complete,
                        'nb_questions' => $quiz->questions->count(),
                        'nb_tentatives' => $userQuiz?->nb_tentatives ?? 0,
                        // 📖 Quiz terminé → toutes les questions ; sinon nombre de questions
                        //    déjà répondues dans la progression sauvegardée (> 0 = "en cours").
                        'questions_repondues' => $complete
                            ? $quiz->questions->count()
                            : count($userQuiz?->progression ?? []),
                        // 📖 null tant que le quiz n'est pas terminé (la colonne vaut 0 par défaut).
                        'score' => $complete ? $userQuiz->score : null,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json($groupes);
    }

    public function show(Request $request, $id)
    {
        $quiz = Quiz::where('statut', 'actif')->findOrFail($id);

        $quiz->load(['questions' => function ($q) use ($quiz) {
            if ($quiz->aleatoire) {
                $q->inRandomOrder();
            } else {
                $q->orderBy('ordre');
            }

            $q->with(['reponses' => function ($r) {
                $r->select('id', 'question_id', 'texte');
            }]);
        }]);

        // 📖 Réponses déjà données lors d'une tentative non terminée (pour reprendre où l'on
        //    s'était arrêté). Ne contient que les choix de l'utilisateur, jamais les bonnes
        //    réponses. On ne garde que les questions encore présentes dans le quiz.
        $userQuiz = UserQuiz::where('user_id', $request->user()->id)
            ->where('quiz_id', $quiz->id)
            ->first();
        $idsQuestions = $quiz->questions->pluck('id');
        $reponsesDonnees = collect($userQuiz && ! $userQuiz->complete ? ($userQuiz->progression ?? []) : [])
            ->filter(fn ($reponseIds, $questionId) => $idsQuestions->contains((int) $questionId))
            ->map(fn ($reponseIds, $questionId) => [
                'question_id' => (int) $questionId,
                'reponse_ids' => array_values($reponseIds),
            ])
            ->values();

        return response()->json([
            'id' => $quiz->id,
            'titre' => $quiz->titre,
            'aleatoire' => $quiz->aleatoire,
            'reponses_donnees' => $reponsesDonnees,
            'questions' => $quiz->questions->map(fn ($question) => [
                'id' => $question->id,
                'intitule' => $question->intitule,
                'type' => $question->type,
                'ordre' => $question->ordre,
                'reponses' => $question->reponses->map(fn ($reponse) => [
                    'id' => $reponse->id,
                    'texte' => $reponse->texte,
                ]),
            ]),
        ]);
    }

    // 📖 Sauvegarde les réponses déjà données pour pouvoir reprendre un quiz plus tard. Ne
    //    corrige rien, n'attribue aucun point : seule la soumission finale (soumettre) le fait.
    public function progression($id, Request $request)
    {
        $validated = $request->validate([
            'reponses' => 'present|array',
            'reponses.*.question_id' => 'required|integer',
            'reponses.*.reponse_ids' => 'required|array',
            'reponses.*.reponse_ids.*' => 'integer',
        ]);

        $user = $request->user();

        $quiz = Quiz::where('statut', 'actif')
            ->with('questions.reponses')
            ->findOrFail($id);

        $userQuiz = UserQuiz::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        // Quiz déjà terminé : une rejouée n'a pas d'état "en cours", on ne touche à rien.
        if ($userQuiz?->complete) {
            return response()->json(['enregistree' => false]);
        }

        // On ne garde que des questions du quiz et, pour chacune, des réponses qui lui
        // appartiennent (ignore silencieusement tout id étranger ou obsolète).
        $progression = [];
        foreach ($validated['reponses'] as $reponseDonnee) {
            $question = $quiz->questions->firstWhere('id', $reponseDonnee['question_id']);

            if (! $question) {
                continue;
            }

            $idsValides = $question->reponses->pluck('id');
            $reponseIds = collect($reponseDonnee['reponse_ids'])
                ->map(fn ($reponseId) => (int) $reponseId)
                ->filter(fn ($reponseId) => $idsValides->contains($reponseId))
                ->unique()
                ->values()
                ->all();

            if ($reponseIds !== []) {
                $progression[$question->id] = $reponseIds;
            }
        }

        if (! $userQuiz) {
            if ($progression === []) {
                return response()->json(['enregistree' => true, 'questions_repondues' => 0]);
            }

            $userQuiz = new UserQuiz(['user_id' => $user->id, 'quiz_id' => $quiz->id]);
        }

        $userQuiz->progression = $progression === [] ? null : $progression;
        $userQuiz->save();

        return response()->json([
            'enregistree' => true,
            'questions_repondues' => count($progression),
        ]);
    }

    public function soumettre($id, Request $request)
    {
        $validated = $request->validate([
            'reponses' => 'required|array',
            'reponses.*.question_id' => 'required|exists:questions,id',
            'reponses.*.reponse_ids' => 'required|array',
        ]);

        $user = $request->user();

        $quiz = Quiz::where('statut', 'actif')
            ->with('questions.reponses')
            ->findOrFail($id);

        $totalQuestions = $quiz->questions->count();
        $bonnesReponses = 0;

        foreach ($validated['reponses'] as $reponseSoumise) {
            $question = $quiz->questions->firstWhere('id', $reponseSoumise['question_id']);

            if (! $question) {
                continue;
            }

            $idsCorrects = $question->reponses->where('est_correcte', true)->pluck('id')->sort()->values();
            $idsSoumis = collect($reponseSoumise['reponse_ids'])->sort()->values();

            if ($idsCorrects->all() === $idsSoumis->all()) {
                $bonnesReponses++;
            }
        }

        $score = $bonnesReponses;

        $userQuiz = UserQuiz::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        $premiereCompletion = $userQuiz === null || ! $userQuiz->complete;
        $pointsGagnes = 0;

        DB::transaction(function () use ($premiereCompletion, $userQuiz, $user, $quiz, $score, &$pointsGagnes) {
            if ($premiereCompletion) {
                if ($userQuiz) {
                    $userQuiz->update([
                        'complete' => true,
                        'points_attribues' => true,
                        'score' => $score,
                        'nb_tentatives' => $userQuiz->nb_tentatives + 1,
                        'completed_at' => now(),
                        'progression' => null,
                    ]);
                } else {
                    UserQuiz::create([
                        'user_id' => $user->id,
                        'quiz_id' => $quiz->id,
                        'score' => $score,
                        'complete' => true,
                        'points_attribues' => true,
                        'nb_tentatives' => 1,
                        'completed_at' => now(),
                    ]);
                }

                PointsHistorique::create([
                    'user_id' => $user->id,
                    'points' => $quiz->points_attribues,
                    'source' => 'quiz',
                    'source_id' => $quiz->id,
                ]);

                $user->increment('points_cumules', $quiz->points_attribues);
                $pointsGagnes = $quiz->points_attribues;

                app(BadgeService::class)->synchroniser($user);
            } else {
                $userQuiz->increment('nb_tentatives');
            }
        });

        return response()->json([
            'score' => $score,
            'total_questions' => $totalQuestions,
            'points_gagnes' => $pointsGagnes,
            'premiere_completion' => $premiereCompletion,
        ]);
    }

}
