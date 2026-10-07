<?php

namespace App\Notifications;

use App\Models\Banniere;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BanniereUrgenteNotification extends Notification
{
    use Queueable;

    public function __construct(private Banniere $banniere)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            // 📖 🚨 préfixé plutôt que laissé au contenu admin : le titre est saisi
            //    librement dans le BO, uniformiser l'emoji en code garantit qu'il est
            //    toujours là, sans dépendre de ce que l'admin a tapé.
            ->title("🚨 {$this->banniere->titre}")
            ->body($this->banniere->message);
    }
}
