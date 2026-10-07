<?php

namespace App\Notifications;

use App\Models\Defi;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NouveauDefiNotification extends Notification
{
    use Queueable;

    public function __construct(private Defi $defi)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Nouveau défi disponible ! 🎯')
            ->body($this->defi->titre);
    }
}
