<?php

namespace Tests\Unit;

use App\Models\Quiz;
use App\Models\User;
use App\Models\UserQuiz;
use App\Notifications\QuizNonTermineNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierQuizNonTermineTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifie_un_quiz_commence_depuis_3_jours_et_pas_fini(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $quiz = Quiz::create(['titre' => 'Quiz test', 'statut' => 'actif']);
        $userQuiz = UserQuiz::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'complete' => false,
            'commence_at' => now()->subDays(3),
        ]);

        Artisan::call('notifications:quiz-non-termine');

        Notification::assertSentTo($user, QuizNonTermineNotification::class);
        $this->assertTrue($userQuiz->fresh()->rappel_envoye);
    }

    public function test_ne_notifie_pas_deux_fois_le_meme_rappel(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $quiz = Quiz::create(['titre' => 'Quiz test', 'statut' => 'actif']);
        UserQuiz::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'complete' => false,
            'commence_at' => now()->subDays(5),
            'rappel_envoye' => true,
        ]);

        Artisan::call('notifications:quiz-non-termine');

        Notification::assertNotSentTo($user, QuizNonTermineNotification::class);
    }

    public function test_ne_relance_pas_un_quiz_desactive_depuis(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $quiz = Quiz::create(['titre' => 'Quiz test', 'statut' => 'inactif']);
        UserQuiz::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'complete' => false,
            'commence_at' => now()->subDays(3),
        ]);

        Artisan::call('notifications:quiz-non-termine');

        Notification::assertNotSentTo($user, QuizNonTermineNotification::class);
    }
}
