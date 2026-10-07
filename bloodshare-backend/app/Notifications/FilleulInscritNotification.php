<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class FilleulInscritNotification extends Notification
{
    use Queueable;

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage())
            ->title('Votre code de parrainage a été utilisé ! 🤝')
            // 📖 Pas de pseudo/identité du filleul dans le message : il n'a encore rien
            //    validé (juste utilisé le code à l'inscription), et l'anonymat reste la règle.
            ->body('Une nouvelle personne a rejoint BloodShare grâce à vous.');
    }
}
