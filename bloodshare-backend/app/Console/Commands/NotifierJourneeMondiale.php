<?php

namespace App\Console\Commands;

use App\Notifications\JourneeMondialeNotification;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class NotifierJourneeMondiale extends Command
{
    protected $signature = 'notifications:journee-mondiale';

    protected $description = "Envoie un message à tous le 14 juin (Journée mondiale du don de sang)";

    // 📖 Planifiée en quotidien dans le scheduler (comme les autres jobs), mais ne fait
    //    quoi que ce soit que le 14/06 : pas besoin d'une syntaxe cron annuelle dédiée.
    public function handle(NotificationService $notificationService): int
    {
        if (now()->format('m-d') !== '06-14') {
            return self::SUCCESS;
        }

        $notificationService->notifierTousLesUsers(new JourneeMondialeNotification());

        $this->info('Notification envoyée à tous.');

        return self::SUCCESS;
    }
}
