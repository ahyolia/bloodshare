<?php

namespace App\Notifications;

use App\Models\StockSang;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class AlertePenurieNotification extends Notification
{
    use Queueable;

    public function __construct(private StockSang $stockSang)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Alerte pénurie 🩸')
            ->body("Le stock de {$this->stockSang->groupe_sanguin} est au niveau critique. Votre don peut faire la différence.");
    }
}
