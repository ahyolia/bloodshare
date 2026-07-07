<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\PointsHistorique;
use App\Models\Quiz;
use App\Models\UserBadge;
use App\Models\UserQuiz;
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
                'quiz' => $quizzesDeCategorie->map(fn ($quiz) => [
                    'id' => $quiz->id,
                    'titre' => $quiz->titre,
                    'points_attribues' => $quiz->points_attribues,
                    'complete' => (bool) $userQuizzes->get($quiz->id)?->complete,
                    'nb_questions' => $quiz->questions->count(),
                ])->values(),
            ];
        })->values();

        return response()->json($groupes);
    }

    public function show($id)
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

        return response()->json([
            'id' => $quiz->id,
            'titre' => $quiz->titre,
            'aleatoire' => $quiz->aleatoire,
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

                $this->verifierBadgeQuizMaster($user);
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

    private function verifierBadgeQuizMaster($user): void
    {
        $nbQuizCompletes = UserQuiz::where('user_id', $user->id)
            ->where('complete', true)
            ->count();

        if ($nbQuizCompletes < 5) {
            return;
        }

        $badge = Badge::where('nom', 'Quiz Master')->first();

        if (! $badge) {
            return;
        }

        $dejaObtenu = UserBadge::where('user_id', $user->id)
            ->where('badge_id', $badge->id)
            ->exists();

        if (! $dejaObtenu) {
            UserBadge::create([
                'user_id' => $user->id,
                'badge_id' => $badge->id,
                'obtenu_at' => now(),
            ]);
        }
    }
}
