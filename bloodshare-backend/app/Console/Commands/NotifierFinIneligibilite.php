<?php

namespace App\Console\Commands;

use App\Models\Don;
use App\Notifications\FinIneligibiliteNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class NotifierFinIneligibilite extends Command
{
    protected $signature = 'notifications:fin-ineligibilite';

    protected $description = "Notifie les utilisateurs qui redeviennent éligibles au don aujourd'hui";

    // 📖 Même règle que ScanController::handleDon (56j homme / 84j femme) : dupliquée ici
    //    plutôt que d'extraire un service partagé, pour ne pas toucher au scan (qui
    //    fonctionne et n'est pas dans le périmètre de cette US).
    public function handle(): int
    {
        $derniersDonsValides = Don::where('statut', 'valide')
            ->selectRaw('user_id, max(date_don) as derniere_date')
            ->groupBy('user_id')
            ->with('user')
            ->get();

        $notifies = 0;

        foreach ($derniersDonsValides as $ligne) {
            $user = $ligne->user;

            if (! $user) {
                continue;
            }

            $delaiJours = $user->sexe === 'femme' ? 84 : 56;
            $dateEligibilite = Carbon::parse($ligne->derniere_date)->addDays($delaiJours);

            if (! $dateEligibilite->isToday()) {
                continue;
            }

            $user->notify(new FinIneligibiliteNotification());
            $notifies++;
        }

        $this->info("{$notifies} utilisateur(s) notifié(s).");

        return self::SUCCESS;
    }
}
