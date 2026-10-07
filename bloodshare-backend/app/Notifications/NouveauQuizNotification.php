<?php

namespace App\Notifications;

use App\Models\Quiz;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NouveauQuizNotification extends Notification
{
    use Queueable;

    public function __construct(private Quiz $quiz)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Nouveau quiz disponible ! 🧠')
            ->body($this->quiz->titre);
    }
}
