<?php

namespace Tests\Unit;

use App\Models\Quiz;
use App\Models\User;
use App\Models\UserQuiz;
use App\Notifications\QuizDuJourNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifierQuizDuJourTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifie_un_utilisateur_qui_n_a_pas_termine_le_quiz_du_jour(): void
    {
        $user = User::factory()->create();
        $user->pushSubscriptions()->create(['endpoint' => 'https://fcm.example/abc', 'public_key' => 'BDH68ZE3PNMnl74jKfsqoVnnk6FYKYn2Nr09BbU2NiiT0qhhX2Yh3jNO58fJYqOhDp8yWV7Gk5NAH085cH8DwQU', 'auth_token' => '0ZWyLlCGSsmRiCCImPm2Bw']);
        Quiz::create(['titre' => 'Quiz actif', 'statut' => 'actif']);

        Notification::fake();

        Artisan::call('notifications:quiz-du-jour');

        Notification::assertSentTo($user, QuizDuJourNotification::class);
    }

    public function test_ne_notifie_pas_un_utilisateur_ayant_deja_termine_le_quiz_du_jour(): void
    {
        $user = User::factory()->create();
        $user->pushSubscriptions()->create(['endpoint' => 'https://fcm.example/abc', 'public_key' => 'BDH68ZE3PNMnl74jKfsqoVnnk6FYKYn2Nr09BbU2NiiT0qhhX2Yh3jNO58fJYqOhDp8yWV7Gk5NAH085cH8DwQU', 'auth_token' => '0ZWyLlCGSsmRiCCImPm2Bw']);
        $quiz = Quiz::create(['titre' => 'Quiz actif', 'statut' => 'actif']);
        UserQuiz::create(['user_id' => $user->id, 'quiz_id' => $quiz->id, 'complete' => true]);

        Notification::fake();

        Artisan::call('notifications:quiz-du-jour');

        Notification::assertNothingSentTo($user);
    }

    public function test_ne_fait_rien_sans_quiz_actif(): void
    {
        $user = User::factory()->create();

        Notification::fake();

        Artisan::call('notifications:quiz-du-jour');

        Notification::assertNothingSentTo($user);
    }
}
