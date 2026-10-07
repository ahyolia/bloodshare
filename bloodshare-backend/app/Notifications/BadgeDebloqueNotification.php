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
        $message = (new WebPushMessage())
            ->title('Nouveau badge débloqué ! 🏆')
            // 📖 Pas de détail du don/parrainage derrière le badge dans le texte : la
            //    notification reste un simple encouragement, aucune donnée sensible.
            ->body("Vous avez obtenu le badge « {$this->badge->nom} ».");

        // 📖 icon() rejette null : tous les badges n'ont pas d'image_url renseignée
        //    (cf. Badge #7 "Premier Pas" en base), l'appel plante sinon.
        if ($this->badge->image_url) {
            $message->icon($this->badge->image_url);
        }

        return $message;
    }
}
