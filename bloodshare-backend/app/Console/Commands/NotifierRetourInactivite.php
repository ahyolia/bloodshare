<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\RetourInactiviteNotification;
use Illuminate\Console\Command;

class NotifierRetourInactivite extends Command
{
    protected $signature = 'notifications:retour-inactivite';

    protected $description = "Relance une seule fois les utilisateurs inactifs depuis 30 jours";

    // 📖 whereDate(..., today - 30) plutôt que "<= 30 jours" : sinon un utilisateur
    //    inactif depuis 60 jours recevrait la notif à chaque exécution du job, alors que
    //    la US ne veut qu'une seule relance, jamais culpabilisante.
    public function handle(): int
    {
        $notifies = 0;

        User::whereDate('derniere_connexion', now()->subDays(30)->toDateString())
            ->each(function (User $user) use (&$notifies) {
                $user->notify(new RetourInactiviteNotification());
                $notifies++;
            });

        $this->info("{$notifies} utilisateur(s) notifié(s).");

        return self::SUCCESS;
    }
}
