<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointsHistorique;
use App\Models\Question;
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

            // 📖 est_correcte est chargé pour corriger les questions déjà validées, mais il
            //    n'est jamais recopié tel quel dans la réponse ci-dessous.
            $q->with(['reponses:id,question_id,texte,est_correcte', 'contenu']);
        }]);

        // 📖 Réponses déjà validées lors d'une tentative non terminée (pour reprendre où l'on
        //    s'était arrêté), avec leur correction : elles sont verrouillées, la révéler ne
        //    permet plus de changer de réponse. On ne garde que les questions encore présentes.
        $userQuiz = UserQuiz::where('user_id', $request->user()->id)
            ->where('quiz_id', $quiz->id)
            ->first();
        $reponsesDonnees = collect($userQuiz && ! $userQuiz->complete ? ($userQuiz->progression ?? []) : [])
            ->map(fn ($reponseIds, $questionId) => [$quiz->questions->firstWhere('id', (int) $questionId), $reponseIds])
            ->filter(fn ($paire) => $paire[0] !== null)
            ->map(fn ($paire) => [
                'question_id' => $paire[0]->id,
                'reponse_ids' => array_values($paire[1]),
                'correction' => $this->corriger($paire[0], $paire[1]),
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

    // 📖 Corrige une question dès que l'utilisateur la valide (US-30). La première réponse
    //    validée est verrouillée dans la progression : on ne peut pas découvrir la bonne
    //    réponse puis en valider une autre, et c'est elle que la soumission finale comptera.
    //    Sur un quiz déjà terminé (rejouée, sans points en jeu), on corrige sans verrouiller.
    public function verifier($id, $questionId, Request $request)
    {
        $validated = $request->validate([
            'reponse_ids' => 'required|array|min:1',
            'reponse_ids.*' => 'integer',
        ]);

        $user = $request->user();

        $quiz = Quiz::where('statut', 'actif')->findOrFail($id);
        $question = $quiz->questions()->with(['reponses', 'contenu'])->findOrFail($questionId);

        $idsValides = $question->reponses->pluck('id');
        $reponseIds = collect($validated['reponse_ids'])
            ->map(fn ($reponseId) => (int) $reponseId)
            ->filter(fn ($reponseId) => $idsValides->contains($reponseId))
            ->unique()
            ->values()
            ->all();

        if ($reponseIds === []) {
            return response()->json([
                'message' => 'Aucune réponse valide pour cette question.',
                'errors' => ['reponse_ids' => ['Aucune réponse valide pour cette question.']],
            ], 422);
        }

        $userQuiz = UserQuiz::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        if (! $userQuiz?->complete) {
            $progression = $userQuiz?->progression ?? [];

            if (isset($progression[$question->id])) {
                $reponseIds = $progression[$question->id];
            } else {
                $userQuiz ??= new UserQuiz([
                    'user_id' => $user->id,
                    'quiz_id' => $quiz->id,
                    'commence_at' => now(),
                ]);
                $progression[$question->id] = $reponseIds;
                $userQuiz->progression = $progression;
                $userQuiz->save();
            }
        }

        return response()->json([
            'question_id' => $question->id,
            'reponse_ids' => array_values($reponseIds),
            ...$this->corriger($question, $reponseIds),
        ]);
    }

    // 📖 Sauvegarde les réponses déjà données pour pouvoir reprendre un quiz plus tard. Ne
    //    corrige rien, n'attribue aucun point : seule la soumission finale (soumettre) le fait.
    //    Une réponse déjà enregistrée (validée via verifier) n'est jamais remplacée.
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

        // 📖 + garde la valeur de gauche : les réponses déjà verrouillées l'emportent.
        $progression = ($userQuiz?->progression ?? []) + $progression;

        if (! $userQuiz) {
            if ($progression === []) {
                return response()->json(['enregistree' => true, 'questions_repondues' => 0]);
            }

            $userQuiz = new UserQuiz([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'commence_at' => now(),
            ]);
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
            // 📖 bail + integer avant exists : « 1.0 » arrivait jusqu'à PostgreSQL, qui le
            //    rejetait pour une colonne entière (erreur 500).
            'reponses.*.question_id' => 'bail|required|integer|exists:questions,id',
            'reponses.*.reponse_ids' => 'required|array',
        ]);

        $user = $request->user();

        $quiz = Quiz::where('statut', 'actif')
            ->with(['questions.reponses', 'questions.contenu'])
            ->findOrFail($id);

        $userQuiz = UserQuiz::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        $totalQuestions = $quiz->questions->count();
        $bonnesReponses = 0;

        // 📖 keyBy : une question n'est comptée qu'une fois. Sans ça, renvoyer 100 fois la
        //    même bonne réponse donnait un score de 100/4 et 1 000 points pour un quiz qui
        //    en vaut 40 (audit cybersécurité). La clé est convertie en entier : sinon « +1 »
        //    était rangé à part de 1, puis retrouvait la même question (revue PR #120).
        $reponsesParQuestion = collect($validated['reponses'])
            ->keyBy(fn ($r) => (int) $r['question_id'])
            ->map(fn ($r) => $r['reponse_ids']);

        // 📖 Les réponses verrouillées par verifier l'emportent sur celles envoyées ici : sinon
        //    on pourrait valider une mauvaise réponse, lire la correction, puis soumettre la bonne.
        if ($userQuiz && ! $userQuiz->complete) {
            foreach ($userQuiz->progression ?? [] as $questionId => $reponseIds) {
                $reponsesParQuestion[(int) $questionId] = $reponseIds;
            }
        }

        $details = [];

        foreach ($quiz->questions->sortBy('ordre') as $question) {
            $reponseIds = collect($reponsesParQuestion->get($question->id, []))
                ->map(fn ($reponseId) => (int) $reponseId)
                ->values()
                ->all();
            $correction = $this->corriger($question, $reponseIds);

            if ($correction['correcte']) {
                $bonnesReponses++;
            }

            $details[] = ['question_id' => $question->id, 'reponse_ids' => $reponseIds, ...$correction];
        }

        // 📖 Plafond par sécurité : quoi qu'on envoie, jamais plus que le nombre de questions.
        $score = min($bonnesReponses, $totalQuestions);

        $premiereCompletion = $userQuiz === null || ! $userQuiz->complete;
        $pointsGagnes = 0;

        // 📖 Règle tranchée le 28/09 : les points sont désormais proportionnels au score, et
        // non plus fixes quel que soit le résultat (0/4 rapportait auparavant les mêmes
        // points qu'un sans-faute). Arrondi au point entier le plus proche.
        $pointsProportionnels = $totalQuestions > 0
            ? (int) round($quiz->points_attribues * $score / $totalQuestions)
            : 0;

        DB::transaction(function () use ($premiereCompletion, $userQuiz, $user, $quiz, $score, $pointsProportionnels, &$pointsGagnes) {
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

                // 📖 Pas de ligne d'historique pour 0 point : rien à tracer, et ça évite une
                // ligne "0 pts" bruyante dans l'historique des points de l'utilisateur.
                if ($pointsProportionnels > 0) {
                    PointsHistorique::create([
                        'user_id' => $user->id,
                        'points' => $pointsProportionnels,
                        'source' => 'quiz',
                        'source_id' => $quiz->id,
                    ]);

                    $user->increment('points_cumules', $pointsProportionnels);
                }

                $pointsGagnes = $pointsProportionnels;

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
            // 📖 Correction de chaque question du quiz, pour le récapitulatif de l'écran score.
            'details' => $details,
        ]);
    }

    /**
     * Correction d'une question pour les réponses données : juste ou non, les bonnes
     * réponses, l'explication et la fiche pratique liée (seulement si elle est publiée).
     *
     * @param  array<int, int|string>  $reponseIds
     */
    private function corriger(Question $question, array $reponseIds): array
    {
        $idsCorrects = $question->reponses->where('est_correcte', true)->pluck('id')->sort()->values();
        $idsDonnes = collect($reponseIds)->map(fn ($reponseId) => (int) $reponseId)->sort()->values();
        $fiche = $question->contenu;

        return [
            'correcte' => $idsCorrects->all() === $idsDonnes->all(),
            'reponses_correctes' => $idsCorrects->all(),
            'explication' => $question->explication,
            'contenu' => $fiche && $fiche->type === 'fiche_info' && $fiche->statut === 'publie'
                ? ['id' => $fiche->id, 'titre' => $fiche->titre]
                : null,
        ];
    }
}
