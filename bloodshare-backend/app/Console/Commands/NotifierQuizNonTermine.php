<?php

namespace App\Console\Commands;

use App\Models\UserQuiz;
use App\Notifications\QuizNonTermineNotification;
use Illuminate\Console\Command;

class NotifierQuizNonTermine extends Command
{
    protected $signature = 'notifications:quiz-non-termine';

    protected $description = "Un seul rappel pour les quiz commencés et pas finis depuis 3 jours";

    public function handle(): int
    {
        $enAttente = UserQuiz::where('complete', false)
            ->where('rappel_envoye', false)
            ->whereNotNull('commence_at')
            ->where('commence_at', '<=', now()->subDays(3))
            // 📖 Sans ce filtre, un quiz désactivé/repassé en brouillon après avoir été
            //    commencé relancerait quand même l'utilisateur pour un quiz que
            //    QuizController::soumettre() refuse désormais (where('statut', 'actif')).
            ->whereHas('quiz', fn ($q) => $q->where('statut', 'actif'))
            ->with(['user', 'quiz'])
            ->get();

        foreach ($enAttente as $userQuiz) {
            $userQuiz->user->notify(new QuizNonTermineNotification($userQuiz->quiz));
            $userQuiz->update(['rappel_envoye' => true]);
        }

        $this->info("{$enAttente->count()} utilisateur(s) notifié(s).");

        return self::SUCCESS;
    }
}
