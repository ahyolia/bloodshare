<?php

namespace App\Notifications;

use App\Models\Defi;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class DefiReussiNotification extends Notification
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
            ->title('Défi réussi 🎉')
            ->body("L'objectif du défi « {$this->defi->titre} » est atteint, merci à tous les participants !");
    }
}
