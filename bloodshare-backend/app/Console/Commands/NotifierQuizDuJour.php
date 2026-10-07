<?php

namespace App\Console\Commands;

use App\Models\Quiz;
use App\Models\User;
use App\Models\UserQuiz;
use App\Notifications\QuizDuJourNotification;
use Illuminate\Console\Command;

class NotifierQuizDuJour extends Command
{
    protected $signature = 'notifications:quiz-du-jour';

    protected $description = "Rappelle chaque jour un quiz actif, désactivable via le toggle notifications";

    // 📖 Distinct de "Nouveau quiz publié" (Quiz::booted()) : celui-ci notifie régulièrement
    //    même sans nouveau contenu, pour remettre en avant les quiz actifs existants.
    //    Un seul quiz par jour (pas un par quiz actif) pour ne pas spammer ; choisi par
    //    rotation sur la date plutôt qu'aléatoire, pour que tout le monde reçoive le même
    //    quiz le même jour (plus simple à déboguer qu'un tirage aléatoire par exécution).
    public function handle(): int
    {
        $quizActifs = Quiz::where('statut', 'actif')->orderBy('id')->get();

        if ($quizActifs->isEmpty()) {
            $this->info('Aucun quiz actif.');

            return self::SUCCESS;
        }

        $quizDuJour = $quizActifs[now()->dayOfYear % $quizActifs->count()];

        $notifies = 0;

        User::whereHas('pushSubscriptions')->each(function (User $user) use ($quizDuJour, &$notifies) {
            $dejaComplete = UserQuiz::where('user_id', $user->id)
                ->where('quiz_id', $quizDuJour->id)
                ->where('complete', true)
                ->exists();

            if ($dejaComplete) {
                return;
            }

            $user->notify(new QuizDuJourNotification($quizDuJour));
            $notifies++;
        });

        $this->info("{$notifies} utilisateur(s) notifié(s).");

        return self::SUCCESS;
    }
}
