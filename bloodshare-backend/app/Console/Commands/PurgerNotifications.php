<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Notifications\DatabaseNotification;

class PurgerNotifications extends Command
{
    protected $signature = 'donnees:purger-notifications';

    protected $description = "Supprime l'historique des notifications de plus d'un an";

    // 📖 Durée annoncée dans la politique de confidentialité (docs/juridique).
    public function handle(): int
    {
        $supprimees = DatabaseNotification::where('created_at', '<', now()->subYear())->delete();

        $this->info("{$supprimees} notification(s) supprimée(s).");

        return self::SUCCESS;
    }
}
