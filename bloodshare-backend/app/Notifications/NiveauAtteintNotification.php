<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NiveauAtteintNotification extends Notification
{
    use Queueable;

    public function __construct(private string $label)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Nouveau niveau atteint ! 🎉')
            ->body("Vous êtes maintenant « {$this->label} ».");
    }
}
