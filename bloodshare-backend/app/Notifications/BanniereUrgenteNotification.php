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
            ->title($this->banniere->titre)
            ->body($this->banniere->message);
    }
}
