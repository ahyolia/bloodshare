<?php

namespace App\Notifications;

use App\Models\Evenement;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class VeilleEvenementNotification extends Notification
{
    use Queueable;

    public function __construct(private Evenement $evenement)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class, 'database'];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title("C'est demain 🎪")
            ->body("« {$this->evenement->titre} » a lieu demain à {$this->evenement->lieu}.");
    }

    // 📖 Réutilise toWebPush() : même titre/corps dans l'historique in-app
    //    (canal database) que dans la notification push.
    public function toArray($notifiable): array
    {
        return $this->toWebPush($notifiable, null)->toArray();
    }
}
