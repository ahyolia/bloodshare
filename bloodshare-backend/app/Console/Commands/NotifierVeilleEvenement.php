<?php

namespace App\Console\Commands;

use App\Models\Evenement;
use App\Notifications\VeilleEvenementNotification;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class NotifierVeilleEvenement extends Command
{
    protected $signature = 'notifications:veille-evenement';

    protected $description = "Prévient la veille (J-1) de chaque événement publié";

    public function handle(NotificationService $notificationService): int
    {
        $evenements = Evenement::where('statut', 'publie')
            ->whereDate('date_heure', now()->addDay()->toDateString())
            ->get();

        foreach ($evenements as $evenement) {
            $notificationService->notifierTousLesUsers(new VeilleEvenementNotification($evenement));
        }

        $this->info("{$evenements->count()} événement(s) notifié(s).");

        return self::SUCCESS;
    }
}
