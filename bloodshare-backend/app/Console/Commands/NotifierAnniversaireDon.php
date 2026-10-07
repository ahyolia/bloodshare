<?php

namespace App\Console\Commands;

use App\Models\Don;
use App\Notifications\AnniversaireDonNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class NotifierAnniversaireDon extends Command
{
    protected $signature = 'notifications:anniversaire-don';

    protected $description = "Remercie les utilisateurs 1 an après leur premier don validé, sans leur redemander de donner";

    public function handle(): int
    {
        $premiersDons = Don::where('statut', 'valide')
            ->selectRaw('user_id, min(date_don) as premiere_date')
            ->groupBy('user_id')
            ->with('user')
            ->get()
            ->filter(fn ($ligne) => Carbon::parse($ligne->premiere_date)->addYear()->isToday());

        foreach ($premiersDons as $ligne) {
            if (! $ligne->user) {
                continue;
            }

            $ligne->user->notify(new AnniversaireDonNotification());
        }

        $this->info("{$premiersDons->count()} utilisateur(s) notifié(s).");

        return self::SUCCESS;
    }
}
