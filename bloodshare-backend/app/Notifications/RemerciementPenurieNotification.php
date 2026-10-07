<?php

namespace App\Notifications;

use App\Models\StockSang;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class RemerciementPenurieNotification extends Notification
{
    use Queueable;

    public function __construct(private StockSang $stockSang)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class, 'database'];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Merci à vous 🙏')
            ->body("Grâce à vous, le stock de {$this->stockSang->groupe_sanguin} n'est plus en pénurie.");
    }

    // 📖 Réutilise toWebPush() : même titre/corps dans l'historique in-app
    //    (canal database) que dans la notification push.
    public function toArray($notifiable): array
    {
        return $this->toWebPush($notifiable, null)->toArray();
    }
}
