<?php

namespace App\Notifications;

use App\Models\Defi;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class ProgressionDefiNotification extends Notification
{
    use Queueable;

    public function __construct(private Defi $defi, private int $progression)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Votre progression dans le défi 🎯')
            ->body("Vous avez contribué {$this->progression} fois au défi « {$this->defi->titre} ». Continuez !");
    }
}
