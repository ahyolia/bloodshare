<?php

namespace App\Notifications;

use App\Models\Badge;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BadgeDebloqueNotification extends Notification
{
    use Queueable;

    public function __construct(private Badge $badge)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Nouveau badge débloqué !')
            // 📖 Pas de détail du don/parrainage derrière le badge dans le texte : la
            //    notification reste un simple encouragement, aucune donnée sensible.
            ->body("Vous avez obtenu le badge « {$this->badge->nom} ».")
            ->icon($this->badge->image_url);
    }
}
