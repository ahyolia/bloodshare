<?php

namespace App\Console\Commands;

use App\Models\Defi;
use App\Models\UserDefi;
use App\Notifications\ProgressionDefiNotification;
use Illuminate\Console\Command;

class NotifierProgressionDefi extends Command
{
    protected $signature = 'notifications:progression-defi';

    protected $description = "Rappelle chaque semaine aux participants d'un défi actif leur progression";

    public function handle(): int
    {
        $defi = Defi::where('statut', 'actif')->first();

        if (! $defi) {
            $this->info('Aucun défi actif.');

            return self::SUCCESS;
        }

        $participants = UserDefi::where('defi_id', $defi->id)
            ->where('progression', '>', 0)
            ->with('user')
            ->get();

        foreach ($participants as $userDefi) {
            $userDefi->user->notify(new ProgressionDefiNotification($defi, $userDefi->progression));
        }

        $this->info("{$participants->count()} participant(s) notifié(s).");

        return self::SUCCESS;
    }
}
